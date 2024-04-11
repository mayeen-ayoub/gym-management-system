const prompt = require('prompt-sync')();
const { SingleBar } = require('cli-progress');
const TableDisplay = require('./tableDisplay.js');
const Trainer = require('./trainer.js');

class Member {	
  constructor(client) {
		this.client = client;
		this.tableDisplay = new TableDisplay();
		this.trainer = new Trainer(this.client);
  }

	/* PUBLIC FUNCTIONS */
	async register() {
		try {
			const firstName = prompt("Enter your first name: ");
			const lastName = prompt("Enter your last name: ");
			const email = prompt("Enter your email: ");
			const password = prompt("Enter your password: ");
			let phoneNumber = null;
			const wantsPhoneNumber = prompt("Would you like to associate a phone number with your profile? Y/N: ").toLowerCase();
			if (wantsPhoneNumber === "y") {
				phoneNumber = prompt("Enter your phone number: ");
			}

			const insertMemberQuery = `
				INSERT INTO Member (first_name, last_name, email, password, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id;
			`;

			const result = await this.client.query(insertMemberQuery, [firstName, lastName, email, password, phoneNumber]);
			const memberId = result.rows[0].id;

			console.log(`Welcome ${firstName}! It's now time to set your fitness goals.`);
			let targetWeight = null;
			let targetTime = null;
			let targetCalories = null;
			const wantsTargetWeight = prompt("Would you like to set a target weight? Y/N: ").toLowerCase();
			if (wantsTargetWeight === "y") {
				targetWeight = parseInt(prompt("Enter your target weight (in pounds): "));
			}
			const wantsTargetTime = prompt("Would you like to set a target time to spend at the gym each week? Y/N: ").toLowerCase();
			if (wantsTargetTime === "y") {
				targetTime = parseFloat(prompt("Enter your target time (in hours): "));
			}
			const wantsTargetCalories = prompt("Would you like to set a target number of calories to burn each week? Y/N: ").toLowerCase();
			if (wantsTargetCalories === "y") {
				targetCalories = parseInt(prompt("Enter your target calories: "));
			}

			const insertFitnessGoalQuery = `
				INSERT INTO Fitness_Goal (member_id, target_weight, target_time, target_calories) VALUES ($1, $2, $3, $4);
			`;

			await this.client.query(insertFitnessGoalQuery, [memberId, targetWeight, targetTime, targetCalories]);

			console.log("Thanks for registering! Your information and fitness goals have been saved.");
		} catch(error) {
			console.log(`ERROR: ${error.message}\n`);
			return;
		}
	}

	async dashboardDisplay() {
		try {
			const memberId = await this.#checkIfMember();
			if (memberId == null) {
				return;
			}

			console.log('===== HEALTH STATISTICS ====');
			await this.#healthStatistics(memberId);

			console.log('===== FITNESS ACHIEVMENTS ====');
			await this.#fitnessAchievements(memberId);

			console.log('===== ALL EXERCISE ROUTINES ====');
			await this.#exerciseRoutines(memberId);
			

		} catch(error) {
			console.log(`ERROR: ${error.message}\n`);
			return;
		}
	}

	async scheduleManagement() {
		const memberId = await this.#checkIfMember();
    if (memberId !== null) {
      console.log('What would you like to do?');
      console.log('1. Register for a personal session');
      console.log('2. Register for a group session');
      console.log('3. Reschedule a personal session');
      console.log('4. Cancel a personal session');
      console.log('5. Withdraw from a group session');
      const selection = parseInt(prompt('Type the corresponding number to make a selection: '));

      switch (selection) {
        case 1:
          await this.#schedulePersonalSession(memberId);
          break;
				case 2:
          await this.#scheduleGroupSession(memberId);
					break;
				case 3:
					await this.#reschedulePersonalSession(memberId);
					break;
				case 4:
					await this.#cancelPersonalSession(memberId);
					break;
				default:
					await this.#cancelGroupSession(memberId);     
			}
    }
	}

	/* PRIVATE FUNCTIONS */
	async #checkIfMember() {
		try {
			const email = prompt("Enter member email: ");
			const password = prompt("Enter password: ");
			const dbPasswordResult = await this.client.query('SELECT id, password FROM Member WHERE email = $1;', [email]);
			const dbPassword = dbPasswordResult?.rows[0]?.password;

			if (dbPasswordResult?.rowCount === 0 || password !== dbPassword) {
					console.log(`Incorrect password. Terminating...`);
					return null;
			}
			return dbPasswordResult.rows[0].id;
		} catch(error) {
			console.log(`ERROR: ${error.message}\n`);
			return null;
		}
	}

	/* DASHBOARD DISPLAY FUNCTIONS */
	async #healthStatistics(memberId) {
		try {
			const query = `
				SELECT ROUND(AVG(heart_rate), 2) AS average_heart_rate, SUM(calories_burned) AS total_calories_burned, SUM(time_spent_at_gym) AS total_time_spent_at_gym, COUNT(date) AS num_gym_sessions
				FROM health_metrics
				WHERE member_id = $1
				GROUP BY member_id;
			`;

			const result = await this.client.query(query, [memberId]);
			if (result.rowCount === 0) {
				console.log('There was no data associated with this member');
				return;
			}

			const headers = ['Average Heart Rate Across Sessions', 'Total Calories Burned', 'Total Time Spent at Gym', 'Number of Gym Sessions'];
			this.tableDisplay.printResultsAsTable(result, headers);
		} catch(error) {
			console.log(`ERROR: ${error.message}\n`);
			return;
		}
	}

	async #fitnessAchievements(memberId) {
		try {
			const mainStatsQuery = `
				SELECT SUM(calories_burned) AS total_calories_burned, SUM(time_spent_at_gym) AS total_time_spent_at_gym
				FROM health_metrics
				WHERE member_id = $1
				GROUP BY member_id;
			`;

			const mainStatsResult = await this.client.query(mainStatsQuery, [memberId]);

			const weightQuery = `
				SELECT weight
				FROM health_metrics
				WHERE member_id = $1
				ORDER BY date DESC
				LIMIT 1;
			`;

			const weightResult = await this.client.query(weightQuery, [memberId]);

			const fitnessGoalResult = await this.client.query('SELECT * FROM fitness_goal WHERE member_id=$1;', [memberId]);

			if (fitnessGoalResult.rows[0]?.target_calories != null) {
				console.log('Calories Burned');
				this.#printProgressBar(mainStatsResult.rowCount === 0 ? 0 : mainStatsResult.rows[0].total_calories_burned, fitnessGoalResult.rows[0].target_calories, 'calories');
			}

			if (fitnessGoalResult.rows[0]?.target_time != null) {
				console.log('Time at Gym');
				this.#printProgressBar(mainStatsResult.rowCount === 0 ? 0 : mainStatsResult.rows[0].total_time_spent_at_gym, fitnessGoalResult.rows[0].target_time, 'hours');
			}

			if (fitnessGoalResult.rows[0]?.target_weight != null && weightResult.rowCount !== 0) {
				console.log('Ideal Weight');
				this.#printProgressBar(weightResult.rowCount === 0 ? 0 : weightResult.rows[0].weight, fitnessGoalResult.rows[0].target_weight, 'lbs', true);
			}

			if (!fitnessGoalResult.rows[0]?.target_calories && !fitnessGoalResult.rows[0]?.target_time && (!fitnessGoalResult.rows[0]?.target_weight || weightResult.rowCount === 0)) {
				console.log("You don't have any goals set up!");
			}
		} catch(error) {
			console.log(`ERROR: ${error.message}\n`);
			return;
		}
	}


	async #exerciseRoutines(memberId) {
		try {
			const personalSessionsQuery = `
				SELECT routine FROM personal_session AS ps
				JOIN personal_session_exercise_routine AS ps_er ON ps.id=ps_er.personal_session_id
				JOIN exercise_routine AS er ON ps_er.exercise_routine_id=er.id
				WHERE member_id = $1;
			`;
			
			const groupSessionQuery = `
				SELECT routine FROM group_session AS gs
				JOIN member_group_session AS m_gs ON m_gs.group_session_id = gs.id
				JOIN member AS m ON m_gs.member_id = m.id
				JOIN group_session_exercise_routine AS gs_er ON gs.id=gs_er.group_session_id
				JOIN exercise_routine AS er ON gs_er.exercise_routine_id=er.id
				WHERE member_id = $1;
			`;

			// get the routines a member has done from the personal and group sessions
			const personalSessionRoutinesResult = await this.client.query(personalSessionsQuery, [memberId]);
			const groupSessionRoutinesResult = await this.client.query(groupSessionQuery, [memberId]);

			// Since it is possible for a member to have done no routines, error checking is required
			const personalSessionRoutines = personalSessionRoutinesResult.rowCount === 0 ? [] : personalSessionRoutinesResult.rows;
			const groupSessionRoutines = groupSessionRoutinesResult.rowCount === 0 ? [] : groupSessionRoutinesResult.rows;

			// combine all the routines together
			const allRoutines = personalSessionRoutines.concat(groupSessionRoutines);

			if (allRoutines.length === 0) {
				console.log("You haven't done any exercise routines with our trainers yet! Book a personal or group session!");
			}

			// find out how many times a member has done a particular routine
			const routinesDict = {};
			allRoutines.forEach(({routine}) => {
				const lowercaseRoutine = routine.toLowerCase();
				if (!(lowercaseRoutine in routinesDict)) {
					routinesDict[lowercaseRoutine] = 0;					
				}
				routinesDict[lowercaseRoutine]++;
			});

			// print the routines they've done
			Object.entries(routinesDict).forEach(([key, value]) => {
				console.log(`You have done the routine "${key}" ${value} times!`);
			});
		} catch(error) {
			console.log(`ERROR: ${error.message}\n`);
			return;
		}
	}
	
	#printProgressBar(current, goal, unit = '', isSwitchGoal = false) {		
		let progressBar; 

		if (isSwitchGoal) {
			progressBar = new SingleBar({
				format: `{bar} {percentage}% | Progress to date: {total} ${unit} | Goal: {value} ${unit}`
			});
			progressBar.start(parseFloat(current), parseFloat(goal));
		} else {
			progressBar = new SingleBar({
				format: `{bar} {percentage}% | Progress to date: {value} ${unit} | Goal: {total} ${unit}`
			});
			progressBar.start(parseFloat(goal), parseFloat(current));
		}
		progressBar.stop();
		console.log();
	}

	/* SCHEDULE MANAGEMENT FUNCTIONS */
	async #schedulePersonalSession(memberId) {
		try {
			const date = prompt("What date do you want the session to be (yyyy-mm-dd)? ");
			const startTime = prompt("What time do you want the session to start (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");
			const endTime = prompt("What time do you want the session to end (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");

			const trainerId = await this.trainer.findAvailableTrainers(date, startTime, endTime);

			if (trainerId == null) {
				console.log("Sorry, there are no available trainers for that date and time. Terminating request...");
				return;
			}

			const insertPersonalSessionQuery = `
				INSERT INTO Personal_Session (member_id, trainer_id, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING id;
			`;
			const personalSession = await this.client.query(insertPersonalSessionQuery, [memberId, trainerId, date, startTime, endTime]);
      const personalSessionId = personalSession?.rows[0]?.id;

			console.log("You've successfully created a personal session. It's now time to add exercise routines to your session:")
      const allExerciseRoutines = await this.client.query('SELECT * FROM Exercise_Routine');
			this.tableDisplay.printResultsAsTable(allExerciseRoutines, ['id', 'Routine']);
			const routinesToAdd = prompt("Enter the list of routine ids that you want to add to your session, each seperated by a comma (ex. 1, 2, 4): ").split(",").map(Number);
	
			const insertExerciseRoutineQuery = `
				INSERT INTO Personal_Session_Exercise_Routine (personal_session_id, exercise_routine_id) VALUES ($1, $2);
			`;

			for (const routineId of routinesToAdd) {
				await this.client.query(insertExerciseRoutineQuery, [personalSessionId, routineId]);
			}

			console.log("You've successfully added exercise routines to your personal session.");
		} catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
	}

	async #reschedulePersonalSession(memberId) {
		try {
			await this.#viewPersonalSessions(memberId);

			const idSelection = parseInt(prompt('Please type the id of the personal session you want to reschedule: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

			console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
			let date = prompt("What date do you want the session to be (yyyy-mm-dd)? ");
			let startTime = prompt("What time do you want the session to start (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");
			let endTime = prompt("What time do you want the session to end (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");

			let updatables = [date, startTime, endTime];

      if (!date || !startTime || !endTime) {
        const result = await this.client.query('SELECT date, start_time, end_time FROM Personal_Session WHERE id=$1', [idSelection]);
        const originalSessionInfo = result?.rows[0];

				const dbUpdatables = ["date", "start_time", "end_time"];
				for (let i = 0; i < updatables.length; i++) {
					updatables[i] = !updatables[i] ? originalSessionInfo[dbUpdatables[i]] : updatables[i];
				}
			}

			const trainerId = await this.trainer.findAvailableTrainers(...updatables);

			if (trainerId == null) {
				console.log("Sorry, there are no available trainers for that date and time. Terminating request...");
				return;
			}

			const updateQuery = `
				UPDATE Personal_Session
				SET trainer_id=$1, date=$2, start_time=$3, end_time=$4
				WHERE id=$5;
			`;

			await this.client.query(updateQuery, [trainerId, ...updatables, idSelection]);
			console.log("Your session has successfully been rescheduled.");
		} catch (error) {
			console.log(`ERROR: ${error.message}\n`);
      return;
		}
	}

	async #cancelPersonalSession(memberId) {
		try {
			await this.#viewPersonalSessions(memberId);

			const idSelection = parseInt(prompt('Please type the id of the personal session you want to cancel: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

			const deleteExerciseRoutinesQuery = `
				DELETE FROM Personal_Session_Exercise_Routine WHERE personal_session_id = $1;
			`;
			await this.client.query(deleteExerciseRoutinesQuery, [idSelection]);

			const deletePersonalSessionQuery = `
				DELETE FROM Personal_Session WHERE id = $1;
			`;
			await this.client.query(deletePersonalSessionQuery, [idSelection]);

			console.log("You've successfully cancelled the personal session.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
	}

	async #viewPersonalSessions(memberId) {
		try {
			const personalSessionQuery = `
				SELECT id, date, start_time, end_time FROM Personal_Session
				WHERE member_id = $1
				ORDER BY date ASC;
			`;

			const allPersonalSessions = await this.client.query(personalSessionQuery, [memberId]);
			const headers = ['id', 'Date', 'Start Time', 'End Time'];
			this.tableDisplay.printResultsAsTable(allPersonalSessions, headers, true, ['date']);
		} catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
	}

	async #scheduleGroupSession(memberId) {
		try {
			const groupSessionQuery = `
				SELECT Group_Session.id, title, date, start_time, end_time FROM Group_Session
				JOIN Room_Booking on Group_Session.room_booking_id = Room_Booking.id;
			`;

      const allGroupSessions = await this.client.query(groupSessionQuery);
      const headers = ['id', 'Title', 'Date', 'Start Time', 'End Time'];
      this.tableDisplay.printResultsAsTable(allGroupSessions, headers, true, ['date']);

			const idSelection = parseInt(prompt('Please type the id of the group session you want to join: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

			const insertQuery = `
				INSERT INTO Member_Group_Session (member_id, group_session_id) VALUES ($1, $2);
			`;
			await this.client.query(insertQuery, [memberId, idSelection]);

			console.log("You've successfully joined the group session.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
	}

	async #cancelGroupSession(memberId) {
		try {
			const groupSessionQuery = `
				SELECT mgs.group_session_id, title, date, start_time, end_time FROM Member_Group_Session AS mgs
				JOIN Group_Session on mgs.group_session_id = Group_Session.id
				JOIN Room_Booking on Group_Session.room_booking_id = Room_Booking.id
				WHERE mgs.member_id = $1
				ORDER BY date ASC;
			`;

      const allGroupSessions = await this.client.query(groupSessionQuery, [memberId]);
      const headers = ['id', 'Title', 'Date', 'Start Time', 'End Time'];
      this.tableDisplay.printResultsAsTable(allGroupSessions, headers, true, ['date']);

			const idSelection = parseInt(prompt('Please type the id of the group session you want to withdraw from: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

			const query = `
				DELETE FROM Member_Group_Session WHERE member_id = $1 AND group_session_id = $2;
			`;
			await this.client.query(query, [memberId, idSelection]);

			console.log("You've successfully withdrawn from the group session.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
	}
}
module.exports = Member;
