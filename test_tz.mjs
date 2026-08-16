const d = new Date('2026-08-15T03:00:00+00:00');
console.log('SP:', d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
console.log('Local:', d.toLocaleDateString('en-CA'));
console.log('Manaus:', d.toLocaleDateString('en-CA', { timeZone: 'America/Manaus' }));
