const client = require('./config.js');
const Member = require('./member.js');

// Once the client connects, call the main function
client.connect(() => {
	main();
});

async function main() {	
	const member = new Member(client);
	await member.register();
	client.end();
}
