-- This file inserts fake data into the tables created in DDL.sql
-- Note: Some of the following data was generated using generatedata.com

INSERT INTO Member (first_name, last_name, email, password, phone_number, join_date) VALUES
  ('Colton','Rodgers','colton.rodgers@gmail.ca','SUQU145','626-718-3423','2023-09-04'),
  ('Oprah','Ross','oprah.ross@hotmail.com','YLIF081','886-844-8566','2023-12-31'),
  ('Robin','Shepherd','robin.shepherd@yahoo.ca','LCYW601','166-746-7856','2024-03-27'),
  ('Oliver','Duran','oliver.duran@gmail.com','BHPY511','176-866-2102','2024-01-20'),
  ('Lucius','Armstrong','lucius.armstrong@hotmail.ca','YDYY722','577-256-1512','2023-04-04');

INSERT INTO Trainer (first_name, last_name, email, password) VALUES
  ('Lars','Kerr','lars.kerr@hotmail.ca','IXDO246'),
  ('Moana','Lester','moana.lester@yahoo.com','BXLP471'),
  ('Solomon','Berry','solomon.berry@gmail.com','CQNK449'),
  ('Rajah','Calderon','rajah.calderon@hotmail.ca','IORJ888'),
  ('Libby','Wright','libby.wright@yahoo.ca','JUPS646');

INSERT INTO Admin (first_name, last_name, email, password) VALUES
  ('Eagan','White','eagan.white@gmail.com','SUQU145'),
  ('Emily','Leonard','emily.leonard@hotmail.ca','YLIF081'),
  ('Akeem','Simmons','akeem.simmons@yahoo.com','LCYW601'),
  ('Keane','Dudley','keane.dudley@gmail.ca','BHPY511'),
  ('Carter','Carroll','carter.carroll@hotmail.com','YDYY722');

INSERT INTO Exercise_Routine (routine) VALUES
  ('Do 50 pushups'),
  ('Do 20 burpees'),
  ('Do 30 situps'),
  ('Sprint 100 meters'),
  ('Do 50 jumping jacks');

INSERT INTO Room_Booking (room_number, event_type, date, start_time, end_time) VALUES
  (163,'Group session','2023-11-11','13:00','14:30'),
  (144,'Group session','2023-09-27','15:00','16:00'),
  (178,'Group session','2024-02-25','13:30','14:30'),
  (135,'Birthday party','2023-07-09','14:00','15:30'),
  (155,'Birthday party','2023-04-06','17:00','18:00');

INSERT INTO Equipment (needs_maintenance, last_maintained) VALUES
  ('true','2023-04-21'),
  ('false','2024-03-14'),
  ('false','2023-11-23'),
  ('true','2023-11-30'),
  ('true','2023-04-29');

INSERT INTO Fitness_Goal (member_id, target_weight, target_time, target_calories) VALUES
  (1,222,10,1450),
  (2,198,5.5,700),
  (3,186,7,800),
  (4,120,3.25,300),
  (5,155,5,350);

INSERT INTO Health_Metrics (member_id, weight, heart_rate, calories_burned, time_spent_at_gym, date) VALUES
  (1,232,95,290,3,'2024-03-25'),
  (2,198,83,80,1.5,'2024-01-09'),
  (3,186,70,94,2,'2024-03-29'),
  (4,120,73,104,1,'2024-02-20'),
  (5,155,99,299,2.25,'2024-04-01');

INSERT INTO Bill (member_id, amount, fee_type, invoice_date, payment_date) VALUES
  (1,150,'Membership fee','2023-09-15','2024-02-28'),
  (2,150,'Membership fee','2023-12-30','2024-01-04'),
  (3,150,'Membership fee','2023-10-08','2024-01-25'),
  (4,100.50,'Group session fee','2023-12-13',NULL),
  (5,50.25,'Personal session fee','2023-05-23','2024-02-23');

INSERT INTO Availability (trainer_id, day_of_week, start_time, end_time) VALUES
  (1,'monday','13:00','16:00'),
  (2,'monday','9:00','17:00'),
  (3,'tuesday','12:30','14:30'),
  (4,'friday','13:00','22:30'),
  (5,'saturday','7:30','16:00');

INSERT INTO Personal_Session (member_id, trainer_id, date, start_time, end_time) VALUES
  (1,1,'2023-11-11','13:00','13:30'),
  (2,1,'2023-09-27','14:00','15:00'),
  (4,3,'2024-02-25','12:30','13:30');

INSERT INTO Personal_Session_Exercise_Routine (personal_session_id, exercise_routine_id) VALUES
  (1, 1),
  (1, 2),
  (2, 1),
  (3, 4);

INSERT INTO Group_Session (room_booking_id, trainer_id, title) VALUES
  (1, 1, 'Get fit fast'),
  (2, 2, 'Crossfit'),
  (3, 3, 'Yoga');

INSERT INTO Group_Session_Exercise_Routine (group_session_id, exercise_routine_id) VALUES
  (1, 1),
  (1, 2),
  (2, 1),
  (2, 3),
  (3, 4);

INSERT INTO Member_Group_Session (member_id, group_session_id) VALUES
  (1, 1),
  (2, 1),
  (1, 2),
  (5, 2);
