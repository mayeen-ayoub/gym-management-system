const client = require('./config.js');
const Member = require('./member.js');
const Trainer = require('./trainer.js');
const Admin = require('./admin.js');

// Once the client connects, call the main function
client.connect(() => {
	main();
});

async function main() {	
	// const member = new Member(client);
	// await member.register();
	// const trainer = new Trainer(client);
	// await trainer.scheduleManagement();
	// await trainer.viewMemberProfile();

	const admin = new Admin(client);
	// await admin.bookRoom();
	await admin.manageEquipment();
	await admin.manageBilling();
	client.end();
}
