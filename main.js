const client = require('./config.js');
const Member = require('./member.js');
const Trainer = require('./trainer.js');
const Admin = require('./admin.js');
const prompt = require('prompt-sync')();
const chalk = require('chalk');

// Once the client connects, call the main function
client.connect(() => {
	main();
});

let selection = 4;

// Heads to a subjection of functions based on the type of user. This loops until the user exits
async function main() {	
	do {
		console.log(chalk.inverse(`=== MAIN MENU ===`));
		console.log("Who is logging in?");
		console.log("1. Member");
		console.log("2. Trainer");
		console.log("3. Admin");
		console.log("4. Exit");
		selection = parseInt(prompt("Please make your selection: "));

		switch (selection) {
			case 1:
				await memberFunctions();
				break;
			case 2:
				await trainerFunctions();	
				break;
			case 3:
				await adminFunctions();
				break;
			default:
				selection = 4;
		}
	} while(selection != 4)

	client.end();
}

// Prompts the user on whether they want to log in or register and then directs them to the related function. This loops until the user exits
async function memberFunctions() {
	const member = new Member(client);
	let selection = 3;
	
	do {
		console.log();
		console.log(chalk.bgBlue(`=== MEMBER MENU ===`));
		console.log("Do you want to log in or sign up?");
		console.log("1. Log in");
		console.log("2. Sign up");
		console.log("3. Exit Menu");
		selection = parseInt(prompt("Please make your selection: "));
		console.log();
		
		switch (selection) {
			case 1:
				// Member log in
				console.log(chalk.blue(`Login:`));
				const memberId = await member.checkIfMember();
				console.log();
				if (memberId == null) {
					// if there is no associated member, break out of the loop
					selection = 3;
				} else {
					await memberActions(member, memberId);
				}
				break;
			case 2:
				console.log(chalk.blue(`Register:`));
				await member.register();
				break;
			default:
				selection = 3;
		}
	} while (selection != 3);	
}

// Calls the desired function related to actions members can take. This loops until the user exits
async function memberActions(member, memberId) {
	let selection = 4;
	do {
		console.log();
		console.log(chalk.bgBlue(`=== MEMBER #${memberId} LOGGED IN ===`));
		console.log("What do you want to do?");
		console.log("1. Update Profile");
		console.log("2. View Dashboard");
		console.log("3. Manage your Gym Sessions");
		console.log("4. Exit Menu");
		selection = parseInt(prompt("Please make your selection: "));
		console.log();
		
		switch (selection) {
			case 1:
				console.log(chalk.blue("Update Profile:"));
				await member.updateProfile(memberId);
				break;
			case 2:
				console.log(chalk.blue("Dashboard:"));
				await member.dashboardDisplay(memberId);
				break;
			case 3:
				console.log(chalk.blue("Manage Gym Sessions:"));
				await member.scheduleManagement(memberId);
				break;
			default:
				selection = 4;
		}
	} while(selection != 4);
}

// Calls the desired function related to actions trainers can take. This loops until the user exits
async function trainerFunctions() {
	const trainer = new Trainer(client);
	let selection = 3;
	
	// trainer log in
	console.log(chalk.green(`\nLogin:`));
	const trainerId = await trainer.checkIfTrainer();
	console.log();

	if (trainerId == null) {
		return;
	}
	do {
		console.log();
		console.log(chalk.bgGreen(`=== TRAINER #${trainerId} LOGGED IN ===`));
		console.log("What do you want to do?");
		console.log("1. Manage your schedule");
		console.log("2. View member profiles");
		console.log("3. Exit Menu");
		selection = parseInt(prompt("Please make your selection: "));
		console.log();
		switch (selection) {
			case 1:
				console.log(chalk.green("Manage Schedule:"));
				await trainer.scheduleManagement(trainerId);
				break;
			case 2:
				console.log(chalk.green("View member profiles:"));
				await trainer.viewMemberProfile();
				break;
			default:
				selection = 3;
		}	
	} while (selection != 3);
}

// Calls the desired function related to actions admin can take. This loops until the user exits
async function adminFunctions() {
	const admin = new Admin(client);
	let selection = 5;
	// admin log in
	console.log(chalk.yellow(`\nLogin:`));
	const adminId = await admin.checkIfAdmin();
	console.log();

	if (adminId == null) {
		return;
	}

	do {
		console.log();
		console.log(chalk.bgYellow(`=== ADMIN #${adminId} LOGGED IN ===`));
		console.log("What do you want to do?");
		console.log("1. Manage Room Bookings");
		console.log("2. Manage Equipment");
		console.log("3. Manage Group Sessions");
		console.log("4. Manage Billing");
		console.log("5. Exit Menu");
		selection = parseInt(prompt("Please make your selection: "));
		console.log();
		switch (selection) {
			case 1:
				console.log(chalk.yellow('Manage Room Bookings:'));
				await admin.manageRoomBookings();
				break;
			case 2:
				console.log(chalk.yellow('Manage Equipment:'));
				await admin.manageEquipment();
				break;
			case 3:
				console.log(chalk.yellow('Manage Group Sessions:'));
				await admin.scheduleGroupSession();
				break;
			case 4:
				console.log(chalk.yellow('Manage Billing:'));
				await admin.manageBilling();
				break;
			default:
				selection = 5;
		}	
	} while (selection != 5);
}
