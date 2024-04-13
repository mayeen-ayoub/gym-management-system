// This file contains all of the operations available to administrative staff

const prompt = require('prompt-sync')();
const TableDisplay = require('./tableDisplay.js');
const Trainer = require('./trainer.js');
const chalk = require('chalk');

class Admin {	
  constructor(client) {
    this.client = client;
    this.tableDisplay = new TableDisplay();
    this.trainer = new Trainer(this.client);
  }

  /* PUBLIC FUNCTIONS */
  // TODO call this function from main
  // Calls the desired function related to room booking
  async manageRoomBookings() {
    console.log("What action would you like to take?");
    console.log('1. Add a new room booking');
    console.log('2. Update a room booking');
    console.log('3. Delete a room booking');
    console.log('4. View room bookings'); 
    const selection = parseInt(prompt('Type the corresponding number to make a selection: '));
        
    switch (selection) {
      case 1:
        await this.bookRoom();
        break;
      case 2:
        await this.#updateRoomBooking();
        break;
      case 3:
        await this.#deleteRoomBooking()
        break;
      default:
        await this.#viewRoomBookings();
    }

  }
  // Given a date, start time and end time, attempts to add a record to the Room_Booking table
  async bookRoom(roomInfo = {}) {
    try {
      let override = Object.keys(roomInfo).length !== 0;
      let adminId = null;
      if (!override) {
        adminId = await this.#checkIfAdmin();
      }
      if (override || adminId !== null) {
        const roomNumber = prompt("Which room would you like to book? ");
        const eventType = override ? "Group Session" : prompt("What kind of event are you booking the room for (group session, birthday party, etc.)? ");
        const date = override ? roomInfo.date : prompt("What date are you booking the room for (yyyy-mm-dd)? ");
        const startTime = override ? roomInfo.startTime : prompt("What time does the event start (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");
        const endTime = override ? roomInfo.endTime : prompt("What time does the event end (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");

        const insertQuery = `
          INSERT INTO Room_Booking (room_number, event_type, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING id;
        `;
        const roomBooked = await this.client.query(insertQuery, [roomNumber, eventType, date, startTime, endTime]);
        console.log("The room booking has been saved.");
        return roomBooked?.rows[0]?.id;
      }
      return null;
    } catch(error) {
      console.log(`UNSUCCESSFUL: ${error.message}\n`);
      return null;
    }
  }

  // Calls the desired function related to equipment management
  async manageEquipment() {
    try {
      const adminId = await this.#checkIfAdmin();
      if (adminId !== null) {
        console.log('How do you want modify the equipment?');
        console.log('1. Add a new machine');
        console.log('2. Update a current machine');
        console.log('3. Delete a machine');
        console.log('4. View machines');
        const selection = parseInt(prompt('Type the corresponding number to make a selection: '));
        
        switch (selection) {
          case 1:
            await this.#addEquipment();
            break;
          case 2:
            await this.#updateEquipment();
            break;
          case 3:
            await this.#deleteEquipment()
            break;
          default:
            await this.#viewEquipment();
        }
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Calls the desired function related to group session management
  async scheduleGroupSession() {
    const adminId = await this.#checkIfAdmin();
    if (adminId === null) { 
      return;
    }
    console.log("How do you want to manage the group session?");
    console.log("1. Add a group session");
    console.log("2. Update a group session");
    console.log("3. View group sessions");
    const selection = parseInt(prompt('Type the corresponding number to make a selection: '));

    switch (selection) {
      case 1:
        await this.#addGroupSession();
        break;
      case 2:
        await this.#updateGroupSession();  
        break;
      default:
        await this.#viewGroupSessions();
    }
  }

  // Calls the desired function related to bill management
  async manageBilling() {
    const adminId = await this.#checkIfAdmin();
    if (adminId !== null) {
      console.log('How do you want modify the invoices?');
      console.log('1. Add a new invoice');
      console.log('2. Update a current invoice');
      console.log('3. Delete an invoice');
      console.log('4. View invoices');
      const selection = parseInt(prompt('Type the corresponding number to make a selection: '));

      switch (selection) {
        case 1:
          await this.#addNewBill();
          break;
        case 2:
          await this.#updateBill();
          break;
        case 3:
          await this.#deleteBill();
          break;
        default:
          await this.#viewBills();
      }
    }
  }

  /* PRIVATE FUNCTIONS */

  // Given an email and password, check if this user is an admin in the DB.
  // Used by all other functions in this class to ensure admins are the only ones able to execute admin-related operations
  // Note: We understand that this method of storing passwords is not the most secure. We'd use a different approach if this were a larger scale app
  async #checkIfAdmin() {
    try {
      const email = prompt("Enter admin email: ");
      const password = prompt("Enter password: ");
      const dbPasswordResult = await this.client.query('SELECT id, password FROM Admin WHERE email = $1;', [email]);
      const dbPassword = dbPasswordResult?.rows[0]?.password;

      if (dbPasswordResult?.rowCount === 0 || password !== dbPassword) {
        console.log(`Incorrect user or password. Terminating...`);
        return null;
      }
      return dbPasswordResult.rows[0].id;
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return null;
    }
  }

  // Updates an existing Room_booking record based on user input
  async #updateRoomBooking() {
    try {
      await this.#viewRoomBookings();
      const idSelection = parseInt(prompt('Please type the id of the invoice you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }
      console.log();

      const roomResult = await this.client.query('SELECT * FROM room_booking WHERE id=$1', [idSelection]);

      if (roomResult.rowCount > 0 && roomResult.rows[0].event_type.toLowerCase() !== "group session") {
        console.log(chalk.yellow('Make any changes when prompted. If nothing is entered, nothing will change for that field.'));
        const roomNumber = prompt("Enter new room number: ");
        const eventType = prompt("Enter new event type: ");
        const date = prompt("Enter new date (yyyy-mm-dd): ");
        const startTime = prompt("Enter new event start time (eg. type 1:30 for 1:30am and 13:30 for 1:30pm): ");
        const endTime = prompt("Enter new event end time (eg. type 1:30 for 1:30am and 13:30 for 1:30pm): ");

        let updatables = [roomNumber, eventType, date, startTime, endTime];

        const originalRoomBookingInfo = roomResult?.rows[0];
				
				const dbUpdatables = ["room_number", "event_type", "date", "start_time", "end_time"]
				for (let i = 0; i < updatables.length; i++) {
					updatables[i] = !updatables[i] ? originalRoomBookingInfo[dbUpdatables[i]] : updatables[i];
				}

        const updateQuery = `
          UPDATE room_booking
          SET room_number=$1, event_type=$2, date=$3, start_time=$4, end_time=$5
          WHERE id=$6;
        `;

        await this.client.query(updateQuery, [...updatables, idSelection]);
        console.log("The room booking has been succesfully updated.");
      } else {
        console.log("This type of action can be done through managing a group session.");
      }
    } catch(error) {
      console.log(`UNSUCCESSFUL: ${error.message}\n`);
      return;
    }
  }

  // Deletes a Room_Booking record based on user input
  async #deleteRoomBooking() {
    try {
      await this.#viewRoomBookings();

      const idSelection = parseInt(prompt('Please type the id of the room booking you want to delete: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }
      console.log();

      const roomResult = await this.client.query('SELECT event_type FROM room_booking WHERE id=$1', [idSelection]);

      if (roomResult.rowCount > 0 && roomResult.rows[0].event_type.toLowerCase() !== "group session") {
        const deleteQuery = `
          DELETE FROM room_booking
          WHERE id=$1;
        `;

        await this.client.query(deleteQuery, [idSelection]);
        console.log("The room booking has been deleted successfully.");
      } else {
        console.log("This type of action can be done through managing a group session.");
      }
    } catch(error) {
      console.log(`UNSUCCESSFUL: ${error.message}\n`);
      return;
    }
  }

  // Displays all Room_Booking records 
  async #viewRoomBookings() {
    try {
        const roomResult = await this.client.query('SELECT * FROM Room_booking;');
        const headers = ['id', 'Room Number', 'Event Type', 'Date', 'Start Time', 'End Time'];
        this.tableDisplay.printResultsAsTable(roomResult, headers, true, ['date']);
    } catch(error) {
      console.log(`UNSUCCESSFUL: ${error.message}\n`);
      return;
    }
  }

  // Displays all Equipment records 
  async #viewEquipment() {
    try {
      const allEquipment = await this.client.query('SELECT * FROM Equipment;');
      const headers = ['id', 'Need Maintenance?', 'Last Maintained On'];
      this.tableDisplay.printResultsAsTable(allEquipment, headers, true, ['last_maintained']);
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Adds a record to the Equipment table based on user input
  async #addEquipment() {
    try {
      const needsMaintenanceInput = prompt("Does the machine need maintenance? Y/N: ").toLowerCase();
      const needsMaintenance = needsMaintenanceInput === "y" ? 'true' : 'false';
      const lastMaintained = prompt("When was the machine last maintained (yyyy-mm-dd)? ");

      const insertQuery = `
        INSERT INTO Equipment (needs_maintenance, last_maintained) VALUES ($1, $2);
      `;

      await this.client.query(insertQuery, [needsMaintenance, lastMaintained]);
      console.log("The machine has been added successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Updates an existing Equipment record based on user input
  async #updateEquipment() {
    try {
      await this.#viewEquipment();

      const idSelection = parseInt(prompt('Please type the id of the machine you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
      const needsMaintenanceInput = prompt("Does the machine need maintenance? Y/N: ").toLowerCase();
      let needsMaintenance;
      if (needsMaintenanceInput === "y") {
        needsMaintenance = 'true';
      } else if (needsMaintenanceInput === "n") {
        needsMaintenance = 'false';
      }
      let lastMaintained = prompt("When was the machine last maintained (yyyy-mm-dd)? ");

      if (!needsMaintenance || !lastMaintained) {
        const result = await this.client.query('SELECT * FROM Equipment WHERE id=$1', [idSelection]);
        const equipmentToChange = result?.rows[0];
        needsMaintenance = !needsMaintenance ? equipmentToChange.needs_maintenance : needsMaintenance;
        lastMaintained = !lastMaintained ? equipmentToChange.last_maintained : lastMaintained;
      }

      const updateQuery = `
        UPDATE Equipment
        SET needs_maintenance=$1, last_maintained=$2
        WHERE id=$3;
      `;

      await this.client.query(updateQuery, [needsMaintenance, lastMaintained, idSelection]);
      console.log("The machine has been updated successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Deletes an Equipment record based on user input
  async #deleteEquipment() {
    try {
      await this.#viewEquipment();
      
      const idSelection = parseInt(prompt('Please type the id of the machine you want to delete: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      const deleteQuery = `
        DELETE FROM Equipment
        WHERE id=$1;
      `;

      await this.client.query(deleteQuery, [idSelection]);
      console.log("The machine has been deleted successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Adds a record to the Group_Session, Room_Booking and Exercise_Routines tables based on user input
  async #addGroupSession() {
		try {
			const date = prompt("What date do you want the session to be (yyyy-mm-dd)? ");
			const startTime = prompt("What time do you want the session to start (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");
			const endTime = prompt("What time do you want the session to end (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");
      const title = prompt("What is the title for this group session? ");

      // Attempts to find an available trainer based on user input
			const trainerId = await this.trainer.findAvailableTrainers(date, startTime, endTime);

			if (trainerId == null) {
				console.log("Sorry, there are no available trainers for that date and time. Terminating request...");
				return;
			}
      
      console.log(`Trainer #${trainerId} will be booked for the group session`);

      // Attempts to book a room based on user input
      const roomBookingId = await this.bookRoom({date, startTime, endTime});

      if (roomBookingId == null) {
        console.log("Sorry, there are no available rooms for that date and time. Terminating request...");
				return;
      }

      // Add a record to Group_Session
			const insertGroupSessionQuery = `
				INSERT INTO Group_Session (room_booking_id, trainer_id, title) VALUES ($1, $2, $3) RETURNING id;
			`;

			const groupSession = await this.client.query(insertGroupSessionQuery, [roomBookingId, trainerId, title]);
      const groupSessionId = groupSession?.rows[0]?.id;

      // Add exercise routines to the session
			console.log("You've successfully created a group session. It's now time to add exercise routines to this session:")
      const allExerciseRoutines = await this.client.query('SELECT * FROM Exercise_Routine');
			this.tableDisplay.printResultsAsTable(allExerciseRoutines, ['id', 'Routine']);
			const routinesToAdd = prompt("Enter the list of routine ids that you want to add to your session, each seperated by a comma (ex. 1, 2, 4): ").split(",").map(Number);

			const insertExerciseRoutineQuery = `
				INSERT INTO Group_Session_Exercise_Routine (group_session_id, exercise_routine_id) VALUES ($1, $2);
			`;

			for (const routineId of routinesToAdd) {
				await this.client.query(insertExerciseRoutineQuery, [groupSessionId, routineId]);
			}

			console.log("You've successfully added exercise routines to your group session.");
		} catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
	}

  // Updates the appropriate records in the Group_Session, Room_Booking and Group_Session_Exercise_Routines tables based on user input
  async #updateGroupSession() {
    try {
      await this.#viewGroupSessions();

      const idSelection = parseInt(prompt('Please type the id of the group session you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
      let date = prompt('Enter the new date (yyyy-mm-dd): ');
      let startTime = prompt('Enter the new start time (eg. type 1:30 for 1:30am and 13:30 for 1:30pm): ');
      let endTime = prompt('Enter the new end time (eg. type 1:30 for 1:30am and 13:30 for 1:30pm): ');
      let title = prompt('Enter the new title for the group session: ');
      let roomNumber = prompt('Enter the new room number for the group session: ');

      let updatables = [date, startTime, endTime, title, roomNumber];
      if (!startTime || !endTime || !date || !title || !roomNumber) {
        const query = `
          SELECT date, start_time, end_time, title, room_number FROM group_session AS gs
          JOIN room_booking AS rb ON rb.id = gs.room_booking_id
          WHERE gs.id = $1;
        `;
        const originalDateTime = await this.client.query(query, [idSelection]);

        const dbUpdatables = ["date", "start_time", "end_time", "title", "room_number"];
				for (let i = 0; i < updatables.length; i++) {
          updatables[i] = !updatables[i] ? originalDateTime.rows[0][dbUpdatables[i]] : updatables[i];
				}
      }

      // Attempts to find an available trainer based on user input
      const trainerId = await this.trainer.findAvailableTrainers(updatables[0], updatables[1], updatables[2]);

			if (trainerId == null) {
				console.log("Sorry, there are no available trainers for that date and time. Terminating request...");
				return;
			}

      console.log(`The trainer that will be assigned is Trainer #${trainerId}`);

      // Updates the room booking based on user input
      const roomBookingUpdateQuery = `
        UPDATE Room_Booking
        SET date=$1, start_time=$2, end_time=$3, room_number=$4
        WHERE id=$5;
      `;

      await this.client.query(roomBookingUpdateQuery, [updatables[0],  updatables[1], updatables[2], updatables[4], idSelection]);
      console.log("The room booking has been update successfully.");

      // Updates the session based on user input
      const groupSessionUpdateQuery = `
        UPDATE group_session
        SET trainer_id=$1, title=$2
        WHERE id=$3;
      `;
      await this.client.query(groupSessionUpdateQuery, [trainerId,  updatables[3], idSelection]);
      console.log("The group session has been updated successfully.");
      
      // Updates the exercise routines linked to this session based on user input
      await this.#viewRoutinesOnGroupSession(idSelection);
      await this.#deleteRoutinesFromGroupSession(idSelection);
      await this.#addRoutinesToGroupSession(idSelection);

    console.log("You've successfully added exercise routines to your group session.");
    } catch(error) {
      console.log(`UNSUCCESSFUL: ${error.message}\n`);
      return;
    }
  }

  // Given a comma seperated list, adds records to the Group_Session_Exercise_Routine join table
  async #addRoutinesToGroupSession(groupSessionId) {
    try {
      await this.#viewRoutines();
      const routinesToAdd = prompt("Enter the list of routine ids that you want to ADD to your session, each seperated by a comma (ex. 1, 2, 4): ").split(",").map(Number);

      const insertExerciseRoutineQuery = `
        INSERT INTO Group_Session_Exercise_Routine (group_session_id, exercise_routine_id) VALUES ($1, $2);
      `;

      for (const routineId of routinesToAdd) {
        await this.client.query(insertExerciseRoutineQuery, [groupSessionId, routineId]);
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Given a comma seperated list, removes records from the Group_Session_Exercise_Routine join table
  async #deleteRoutinesFromGroupSession(groupSessionId) {
    try {
      const routinesToDelete = prompt("Enter the list of routine ids that you want to DELETE from your session, each seperated by a comma (ex. 1, 2, 4): ").split(",").map(Number);

      const deleteExerciseRoutineQuery = `
        DELETE FROM Group_Session_Exercise_Routine WHERE group_session_id=$1 AND exercise_routine_id=$2;
      `;

      for (const routineId of routinesToDelete) {
        await this.client.query(deleteExerciseRoutineQuery, [groupSessionId, routineId]);
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Displays the available exercise routines
  async #viewRoutines() {
    const allExerciseRoutines = await this.client.query('SELECT * FROM Exercise_Routine');
    this.tableDisplay.printResultsAsTable(allExerciseRoutines, ['id', 'Routine']);
  }

  // Displays the exercise routines linked to a given group session
  async #viewRoutinesOnGroupSession(groupSessionId) {
    const query = `
      SELECT er.id, er.routine FROM group_session_exercise_routine AS gs_er
      JOIN exercise_routine AS er ON er.id = gs_er.exercise_routine_id
      WHERE gs_er.group_session_id = $1;
    `;
    const exerciseRoutinesOnGroupSession = await this.client.query(query, [groupSessionId]);
    this.tableDisplay.printResultsAsTable(exerciseRoutinesOnGroupSession, ['id', 'Routine']);
  }

  // Displays all group sessions along with their dates, times and trainers
  async #viewGroupSessions() {
    try {
      const groupSessionQuery = `
        SELECT Group_Session.id, title, CONCAT(trainer.first_name, ' ', trainer.last_name) AS trainer_name, room_number, date, start_time, end_time FROM Group_Session
        JOIN Room_Booking on Group_Session.room_booking_id = Room_Booking.id
        JOIN trainer on Group_Session.trainer_id = trainer.id;
			`;
      const allGroupSessions = await this.client.query(groupSessionQuery);
      const headers = ['id', 'Title', 'Trainer Name', 'Room Number', 'Date', 'Start Time', 'End Time'];
      this.tableDisplay.printResultsAsTable(allGroupSessions, headers, true, ['date']);
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Displays all bills
  async #viewBills() {
    try {
      const allBills = await this.client.query('SELECT * FROM Bill;');
      const headers = ['id', 'Member id', 'Amount ($)', 'Fee Type', 'Invoice Date', 'Payment Date'];
      this.tableDisplay.printResultsAsTable(allBills, headers, true, ['invoice_date', 'payment_date']);
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Adds a record to the Bill table based on user input
  async #addNewBill() {
    try {
      const memberIdSelection = await this.#promptMemberId();
			if (!memberIdSelection) {
				console.log("No valid id was entered. Terminating request...");
				return;
			}
      const amount = parseFloat(prompt('Please type the amount of the invoice: ')).toFixed(2);
      const feeType = prompt('Please enter the type of fee (ex. membership fee, group session fee, etc.): ');
      const invoiceDate = prompt('Please enter the date of the invoice (yyyy-mm-dd): ');
      let paymentDate = null;
      const hasPaid = prompt("Has the invoice been paid yet? Y/N: ").toLowerCase();
      if (hasPaid === "y") {
        paymentDate = prompt('Please enter the date the invoice was paid (yyyy-mm-dd): ');
      }

      const insertQuery = `
        INSERT INTO Bill (member_id, amount, fee_type, invoice_date, payment_date) VALUES ($1, $2, $3, $4, $5);
      `;

      await this.client.query(insertQuery, [memberIdSelection, amount, feeType, invoiceDate, paymentDate]);
      console.log("The invoice has been added successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Updates a Bill record based on user input
  async #updateBill() {
    try {
      await this.#viewBills();

      const idSelection = parseInt(prompt('Please type the id of the invoice you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      let memberIdSelection;
      const isUpdatingMemberId = prompt("Would you like to update the member id of this invoice? Y/N: ").toLowerCase();
      if (isUpdatingMemberId === "y") {
        memberIdSelection = await this.#promptMemberId();
        if (!memberIdSelection) {
          console.log("No valid id was entered. Terminating request...");
          return;
        }
      }

      console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
      let amount = parseFloat(prompt('Please type the amount of the invoice: ')).toFixed(2);
      let feeType = prompt('Please enter the type of fee (ex. membership fee, group session fee, etc.): ');
      let invoiceDate = prompt('Please enter the date of the invoice (yyyy-mm-dd): ');
      let paymentDate = null;
      const hasPaid = prompt("Has the invoice been paid yet? Y/N: ").toLowerCase();
      if (hasPaid === "y") {
        paymentDate = prompt('Please enter the date the invoice was paid (yyyy-mm-dd): ');
      }

      if (isUpdatingMemberId === "y" || !amount || !feeType || !invoiceDate || !paymentDate) {
        const result = await this.client.query('SELECT * FROM Bill WHERE id=$1', [idSelection]);
        const billToChange = result?.rows[0];
        memberIdSelection = isUpdatingMemberId === "y" ? memberIdSelection : billToChange.member_id;
        amount = isNaN(amount) ? billToChange.amount : amount;
        feeType = !feeType ? billToChange.fee_type : feeType;
        invoiceDate = !invoiceDate ? billToChange.invoice_date : invoiceDate;
        paymentDate = !paymentDate ? billToChange.payment_date : paymentDate;
      }
      const updateQuery = `
        UPDATE Bill
        SET member_id=$1, amount=$2, fee_type=$3, invoice_date=$4, payment_date=$5
        WHERE id=$6;
      `;

      await this.client.query(updateQuery, [memberIdSelection, amount, feeType, invoiceDate, paymentDate, idSelection]);
      console.log("The invoice has been updated successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Deletes a Bill record based on user input
  async #deleteBill() {
    try {
      await this.#viewBills();

      const idSelection = parseInt(prompt('Please type the id of the invoice you want to delete: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      const deleteQuery = `
        DELETE FROM Bill
        WHERE id=$1;
      `;

      await this.client.query(deleteQuery, [idSelection]);
      console.log("The invoice has been deleted successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  // Displays all members and prompts the user for a member_id
  async #promptMemberId() {
    const allMembers = await this.client.query('SELECT id, first_name, last_name, email, phone_number, join_date FROM Member;');
    const headers = ['id', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Join Date'];
    this.tableDisplay.printResultsAsTable(allMembers, headers,  true, ['join_date']);

    const memberIdSelection = parseInt(prompt('Please type the id of the member you want to invoice: '));
    return memberIdSelection;
  }
}
module.exports = Admin;
