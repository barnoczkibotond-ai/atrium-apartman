const CHAT_ID = '7789099560';
const clean = (value, max = 500) => String(value ?? '').slice(0, max).replace(/[<>]/g, '');
const iso = /^\d{4}-\d{2}-\d{2}$/;
export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', {status:405});
  let data;
  try { data = await request.json(); } catch { return new Response('Invalid JSON',{status:400}); }
  if (data['bot-field']) return new Response(JSON.stringify({ok:true}),{status:200});
  const {erkezes,tavozas,vendegek,nev,email,telefon,uzenet,adatkezeles_elfogadva} = data;
  const guests = Number(vendegek);
  if (!iso.test(erkezes||'') || !iso.test(tavozas||'') || !(tavozas > erkezes) || !Number.isInteger(guests) || guests < 1 || guests > 4 || !nev || !email || !telefon || adatkezeles_elfogadva !== 'igen') return new Response('Invalid booking',{status:400});
  const days = Math.round((Date.parse(tavozas+'T12:00:00Z')-Date.parse(erkezes+'T12:00:00Z'))/86400000);
  if (days < 1 || days > 90 || String(nev).length > 150 || String(email).length > 200 || String(telefon).length > 80) return new Response('Invalid booking',{status:400});
  const amount = days * (45000 + Math.max(0, guests - 2)*10000);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {console.error('TELEGRAM_BOT_TOKEN missing');return new Response('Service unavailable',{status:503});}
  const message = ['🏠 ÁTRIUM APARTMAN – ÚJ FOGLALÁSI KÉRELEM','',`👤 Név: ${clean(nev,150)}`,`📅 Érkezés: ${erkezes}`,`📅 Távozás: ${tavozas}`,`🌙 Éjszakák: ${days}`,`👥 Vendégek: ${guests}`,`💰 Becsült összeg: ${amount.toLocaleString('hu-HU')} Ft`,`📞 Telefon: ${clean(telefon,80)}`,`✉️ E-mail: ${clean(email,200)}`,`💬 Üzenet: ${clean(uzenet,1200)||'–'}`,'','⚠️ A foglalás csak visszaigazolás után végleges.'].join('\n');
  try {
    const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:CHAT_ID,text:message})});
    if (!result.ok) {console.error('Telegram send failed',result.status);return new Response('Notification failed',{status:502});}
    return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
  } catch(err){console.error('Telegram network error');return new Response('Notification failed',{status:502});}
};
