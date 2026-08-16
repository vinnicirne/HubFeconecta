const token = 'EAAdURhkGe7IBSE2AHAt6P0pthIPvN5ha81yikt8ZC2krnmcCzEUvcboHgmTPVBS9OOvUq8vg6CI8TLJVhPWaZAGjZAn54p8ncZBjaTISLmI8NdAw9Yj2pkwzli6fHK8TSaINj9DRtuS7CQDl23qR9DG4m5881CeHh9AFfkIEHf7DOc6u0tYfpme8ZBZCcGsIH5';

async function run() {
  const accountsUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${token}`;
  const accountsRes = await fetch(accountsUrl);
  const accountsData = await accountsRes.json();
  console.log("Pages:", accountsData);
}
run();
