.select('*')
.eq('id', currentUser.id)
.single(); // ❌
