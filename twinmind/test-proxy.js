fetch('http://localhost:54247/api/chat', {
    method: 'POST',
    body: JSON.stringify({
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-proj-test'
        },
        payload: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hello' }]
        }
    })
}).then(res => res.text()).then(console.log).catch(console.error);
