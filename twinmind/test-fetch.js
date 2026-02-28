async function test() {
    try {
        await fetch('https://api.openai.com/v1/chat/completions', { headers: { 'Authorization': 'Bearer sk-proj-123\n' } });
    } catch (e) {
        console.log('Newline in header:', e.message);
    }
    try {
        await fetch('https://invalid-url.openai.azure.com/test', { method: 'POST' });
    } catch (e) {
        console.log('Invalid host:', e.message);
    }
}
test();
