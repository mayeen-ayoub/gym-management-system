const client = require('./config.js');
const prompt = require('prompt-sync')();

// Once the client connects, call the main function
client.connect(() => {
	main();
});

async function main() {	
	console.log("Add code here");
	client.end();
}
