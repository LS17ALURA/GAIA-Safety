import fetch from 'node-fetch';

async function testRegister() {
  const res = await fetch('http://localhost:3000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerName: 'Lavinia',
      chatId: '6425265897',
      contacts: ['1234567897','9876543210']
    })
  });
  console.log('Status register:', res.status);
  console.log('Body register:', await res.json());
}

testRegister();
