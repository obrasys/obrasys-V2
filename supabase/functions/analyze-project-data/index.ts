import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { format, differenceInDays, parseISO } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract JWT from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('Edge Function: Unauthorized - Missing Authorization header');
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create Supabase client with the user's JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  try {
    const { project_id } = await req.json();
    console.log('Edge Function: Received project_id:', project_id);

    if (!project_id) {
      console.error('Edge Function: Bad Request - project_id is required.');
      return new Response(JSON.stringify({ error: 'project_id é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generatedAlerts: any[] = [];

    // --- Fetch Project Data ---
    console.log('Edge Function: Fetching project data for project_id:', project_id);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, clients(nome)')
      .eq('id', project_id)
      .single();

    if (projectError) {
      console.error('Edge Function: Error fetching project:', projectError);
      return new Response(JSON.stringify({ error: `Erro ao carregar dados do projeto: ${projectError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!project) {
      console.error('Edge Function: Project not found for project_id:', project_id);
      return new Response(JSON.stringify({ error: 'Projeto não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Edge Function: Project data fetched successfully:', project.nome);

    const projectName = project.nome;
    const projectCompanyId = project.company_id;
    const projectClientName = project.clients?.nome || 'N/A';

    // --- Fetch Budget Data ---
    console.log('Edge Function: Fetching budget data for project.budget_id:', project.budget_id);
    let budget: any = null;
    let budgetItems: any[] = [];
    if (project.budget_id) {
      const { data: fetchedBudget, error: budgetFetchError } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_chapters (
            budget_items (*)
          )
        `)
        .eq('id', project.budget_id)
        .single();

      if (budgetFetchError && budgetFetchError.code !== 'PGRST116') {
        console.warn('Edge Function: Error fetching budget for project:', budgetFetchError);
        generatedAlerts.push({
          project_id: project.id,
          project_name: projectName,
          type: "Data Inconsistency",
          severity: "warning",
          title: "Erro ao carregar orçamento",
          message: `Não foi possível carregar o orçamento associado ao projeto: ${budgetFetchError.message}.`,
        });
      } else if (fetchedBudget) {
        budget = fetchedBudget;
        budgetItems = budget.budget_chapters.flatMap((chapter: any) => chapter.budget_items);
        console.log('Edge Function: Budget data fetched successfully for budget_id:', project.budget_id);
      } else {
        console.log('Edge Function: No budget found for project.budget_id:', project.budget_id);
      }
    } else {
      console.log('Edge Function: Project has no budget_id.');
    }

    // --- Fetch Schedule Data ---
    console.log('Edge Function: Fetching schedule data for project_id:', project.id);
    let schedule: any = null;
    let scheduleTasks: any[] = [];
    const { data: fetchedSchedule, error: scheduleFetchError } = await supabase
      .from('schedules')
      .select('*')
      .eq('project_id', project.id)
      .single();

    if (scheduleFetchError && scheduleFetchError.code !== 'PGRST116') {
      console.warn('Edge Function: Error fetching schedule for project:', scheduleFetchError);
      generatedAlerts.push({
        project_id: project.id,
        project_name: projectName,
        type: "Data Inconsistency",
        severity: "warning",
        title: "Erro ao carregar cronograma",
        message: `Não foi possível carregar o cronograma associado ao projeto: ${scheduleFetchError.message}.`,
      });
    } else if (fetchedSchedule) {
      schedule = fetchedSchedule;
      console.log('Edge Function: Schedule data fetched successfully for project_id:', project.id);
      console.log('Edge Function: Fetching schedule tasks for schedule_id:', schedule.id);
      const { data: fetchedTasks, error: tasksFetchError } = await supabase
        .from('schedule_tasks')
        .select('*')
        .eq('schedule_id', schedule.id);
      if (tasksFetchError) {
        console.warn('Edge Function: Error fetching schedule tasks:', tasksFetchError);
        generatedAlerts.push({
          project_id: project.id,
          project_name: projectName,
          type: "Data Inconsistency",
          severity: "warning",
          title: "Erro ao carregar tarefas do cronograma",
          message: `Não foi possível carregar as tarefas do cronograma: ${tasksFetchError.message}.`,
        });
      } else {
        scheduleTasks = fetchedTasks;
        console.log('Edge Function: Schedule tasks fetched successfully. Count:', scheduleTasks.length);
      }
    } else {
      console.log('Edge Function: No schedule found for project_id:', project.id);
    }

    // --- Fetch RDO Entries ---
    console.log('Edge Function: Fetching RDO entries for project_id:', project.id);
    const { data: rdoEntries, error: rdoFetchError } = await supabase
      .from('rdo_entries')
      .select('*, responsible_user:profiles!rdo_entries_responsible_user_id_fkey(id, first_name, last_name, avatar_url)') // Explicitly use the foreign key
      .eq('project_id', project.id)
      .order('date', { ascending: false });

    if (rdoFetchError) {
      console.warn('Edge Function: Error fetching RDO entries:', rdoFetchError);
      generatedAlerts.push({
        project_id: project.id,
        project_name: projectName,
        type: "Data Inconsistency",
        severity: "warning",
        title: "Erro ao carregar RDOs",
        message: `Não foi possível carregar os registos diários de obra: ${rdoFetchError.message}.`,
      });
    } else {
      console.log('Edge Function: RDO entries fetched successfully. Count:', rdoEntries?.length);
    }

    // --- Analysis and Alert Generation ---
    console.log('Edge Function: Starting analysis and alert generation...');

    // 1. Cost Deviation (Project Level)
    const projectCostDeviation = project.custo_real - project.custo_planeado;
    const projectCostDeviationPercentage = project.custo_planeado > 0 ? (projectCostDeviation / project.custo_planeado) * 100 : 0;
    if (projectCostDeviationPercentage > 20) {
      generatedAlerts.push({
        company_id: projectCompanyId,
        project_id: project.id,
        project_name: projectName,
        type: "Cost Deviation",
        severity: "critical",
        title: "Desvio de Custo Crítico no Projeto",
        message: `O custo real do projeto (${project.custo_real}€) excede o custo planeado (${project.custo_planeado}€) em ${projectCostDeviation.toFixed(2)}€ (${projectCostDeviationPercentage.toFixed(1)}%).`,
      });
    } else if (projectCostDeviationPercentage > 5) {
      generatedAlerts.push({
        company_id: projectCompanyId,
        project_id: project.id,
        project_name: projectName,
        type: "Cost Deviation",
        severity: "warning",
        title: "Desvio de Custo no Projeto",
        message: `O custo real do projeto (${project.custo_real}€) excede o custo planeado (${project.custo_planeado}€) em ${projectCostDeviation.toFixed(2)}€ (${projectCostDeviationPercentage.toFixed(1)}%).`,
      });
    } else if (projectCostDeviationPercentage < -5) {
      generatedAlerts.push({
        company_id: projectCompanyId,
        project_id: project.id,
        project_name: projectName,
        type: "Cost Deviation",
        severity: "info",
        title: "Custo Abaixo do Planeado",
        message: `O custo real do projeto (${project.custo_real}€) está abaixo do custo planeado (${project.custo_planeado}€) em ${Math.abs(projectCostDeviation).toFixed(2)}€ (${Math.abs(projectCostDeviationPercentage).toFixed(1)}%).`,
      });
    }

    // 2. Cost Deviation (Budget Item Level)
    budgetItems.forEach(item => {
      const itemDeviation = item.custo_executado - item.custo_planeado;
      const itemDeviationPercentage = item.custo_planeado > 0 ? (itemDeviation / item.custo_planeado) * 100 : 0;
      if (itemDeviationPercentage > 20) {
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Cost Deviation",
          severity: "critical",
          title: `Desvio de Custo Crítico no Serviço: ${item.servico}`,
          message: `O custo executado para o serviço '${item.servico}' (${item.custo_executado}€) excede o planeado (${item.custo_planeado}€) em ${itemDeviation.toFixed(2)}€ (${itemDeviationPercentage.toFixed(1)}%).`,
        });
      } else if (itemDeviationPercentage > 5) {
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Cost Deviation",
          severity: "warning",
          title: `Desvio de Custo no Serviço: ${item.servico}`,
          message: `O custo executado para o serviço '${item.servico}' (${item.custo_executado}€) excede o planeado (${item.custo_planeado}€) em ${itemDeviation.toFixed(2)}€ (${itemDeviationPercentage.toFixed(1)}%).`,
        });
      }
    });

    // 3. Schedule Deviation
    const today = new Date();
    scheduleTasks.forEach(task => {
      if (task.estado === "Atrasado") {
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Schedule Deviation",
          severity: "critical",
          title: `Tarefa Atrasada: ${task.capitulo}`,
          message: `A fase '${task.capitulo}' está marcada como 'Atrasado'.`,
        });
      } else if (task.estado !== "Concluído" && task.data_fim && parseISO(task.data_fim) < today) {
        const daysLate = differenceInDays(today, parseISO(task.data_fim));
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Schedule Deviation",
          severity: daysLate > 7 ? "critical" : "warning",
          title: `Tarefa com Prazo Expirado: ${task.capitulo}`,
          message: `A fase '${task.capitulo}' não foi concluída e o prazo final (${format(parseISO(task.data_fim), 'dd/MM/yyyy')}) expirou há ${daysLate} dias.`,
        });
      }
    });

    // 4. Missing RDOs (Simplified: check for recent activity if Livro de Obra exists)
    if (rdoEntries && rdoEntries.length === 0) {
      generatedAlerts.push({
        company_id: projectCompanyId,
        project_id: project.id,
        project_name: projectName,
        type: "Missing RDOs",
        severity: "warning",
        title: "Faltam Registos Diários de Obra (RDOs)",
        message: "Não foram encontrados registos diários de obra para este projeto. É crucial manter os RDOs atualizados.",
      });
    } else if (rdoEntries && rdoEntries.length > 0) {
      // Check for recent RDO activity (e.g., last 3 working days)
      const lastRdoDate = parseISO(rdoEntries[0].date);
      const daysSinceLastRDO = differenceInDays(today, lastRdoDate);
      if (daysSinceLastRDO > 3) { // Assuming 3 days is a reasonable threshold for "recent"
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Missing RDOs",
          severity: "warning",
          title: "RDOs Desatualizados",
          message: `O último registo diário de obra foi há ${daysSinceLastRDO} dias (${format(lastRdoDate, 'dd/MM/yyyy')}). Considere adicionar RDOs mais recentes.`,
        });
      }
    }

    // 5. Inconsistent Execution vs Planning (Progress)
    scheduleTasks.forEach(task => {
      const relatedRdoProgress = rdoEntries?.find(rdo =>
        rdo.event_type === 'task_progress_update' &&
        rdo.details?.task_name === task.capitulo &&
        rdo.details?.new_progress !== undefined
      );

      if (relatedRdoProgress && relatedRdoProgress.details.new_progress !== task.progresso) {
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Inconsistent Execution vs Planning",
          severity: "warning",
          title: `Inconsistência de Progresso na Fase: ${task.capitulo}`,
          message: `O progresso da fase '${task.capitulo}' no cronograma (${task.progresso}%) difere do progresso reportado no RDO (${relatedRdoProgress.details.new_progress}%).`,
        });
      }
    });

    // 6. Margin Risk (Budget Level)
    if (budget) {
      const budgetMargin = budget.total_planeado > 0 ? ((budget.total_planeado - budget.total_executado) / budget.total_planeado) * 100 : 0;
      if (budgetMargin < 5) {
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Margin Risk",
          severity: "critical",
          title: "Risco Crítico na Margem de Lucro do Orçamento",
          message: `A margem de lucro atual do orçamento (${budgetMargin.toFixed(1)}%) está abaixo do limite crítico de 5%.`,
        });
      } else if (budgetMargin < 10) {
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Margin Risk",
          severity: "warning",
          title: "Risco na Margem de Lucro do Orçamento",
          message: `A margem de lucro atual do orçamento (${budgetMargin.toFixed(1)}%) está abaixo do limite de atenção de 10%.`,
        });
      }
    } else {
      generatedAlerts.push({
        company_id: projectCompanyId,
        project_id: project.id,
        project_name: projectName,
        type: "Margin Risk",
        severity: "info",
        title: "Orçamento não disponível para análise de margem",
        message: "Não foi possível calcular o risco de margem pois o orçamento associado não foi encontrado ou está incompleto.",
      });
    }

    // --- Persist Alerts to Database ---
    if (generatedAlerts.length > 0) {
      const alertsToInsert = generatedAlerts.map(alert => ({
        company_id: alert.company_id,
        project_id: alert.project_id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        resolved: false,
      }));

      console.log('Edge Function: Attempting to insert alerts:', alertsToInsert);
      const { error: insertError } = await supabase
        .from('ai_alerts')
        .insert(alertsToInsert);

      if (insertError) {
        console.error('Edge Function: Error inserting AI alerts into database:', insertError);
        generatedAlerts.push({
          company_id: projectCompanyId,
          project_id: project.id,
          project_name: projectName,
          type: "Persistence Error",
          severity: "critical",
          title: "Erro ao guardar alertas",
          message: `Não foi possível guardar os alertas gerados na base de dados: ${insertError.message}.`,
        });
      } else {
        console.log('Edge Function: Alerts inserted successfully.');
      }
    } else {
      console.log('Edge Function: No alerts generated to insert.');
    }

    console.log('Edge Function: Analysis complete. Returning generated alerts.');
    return new Response(JSON.stringify(generatedAlerts), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function: Unhandled error in serve block:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});