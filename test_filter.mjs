const posts = [
  { id: 'db6b8', status: 'published', scheduled_for: null, created_at: '2026-08-15T03:01:02.045013+00:00' },
  { id: 'f34f8', status: 'pending', scheduled_for: '2026-08-15T03:00:00+00:00', created_at: '2026-08-14T13:54:34.394692+00:00' }
];

const d = new Date('2026-08-14T23:32:00-03:00'); // User's local time approx
const day = d.getDay();
const diff = day === 0 ? -6 : 1 - day;
d.setDate(d.getDate() + diff);
d.setHours(0, 0, 0, 0);

const weekDays = [];
for (let i = 0; i < 7; i++) {
  const date = new Date(d);
  date.setDate(d.getDate() + i);
  weekDays.push(date);
}

weekDays.forEach(day => {
  const localDateStr = day.toLocaleDateString('en-CA');
  const dayPosts = posts.filter(p => {
    const targetDate = p.scheduled_for || (p.status === 'published' ? p.created_at : null);
    if (!targetDate) return false;
    const pDate = new Date(targetDate);
    const pLocalDateStr = pDate.toLocaleDateString('en-CA');
    return pLocalDateStr === localDateStr;
  });
  console.log(`Day: ${localDateStr} -> Posts: ${dayPosts.map(p => p.id).join(', ')}`);
});
