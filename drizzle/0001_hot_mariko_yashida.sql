CREATE TABLE `balances` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`last_updated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `balances_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `forgot_password_requests` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forgot_password_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_plans` (
	`id` varchar(36) NOT NULL,
	`tier` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`tenure` varchar(50) NOT NULL DEFAULT 'year',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_plans_tier_unique` UNIQUE(`tier`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`membership_id` varchar(36),
	`payment_session_id` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL,
	`status` varchar(50) NOT NULL,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_payment_session_id_unique` UNIQUE(`payment_session_id`)
);
--> statement-breakpoint
CREATE TABLE `premium_membership_data` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`tier` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`current_period_start` timestamp NOT NULL,
	`current_period_end` timestamp NOT NULL,
	`auto_renew` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premium_membership_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `premium_membership_data_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `id` TO `user_id`;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`user_id`);--> statement-breakpoint
ALTER TABLE `expenses` ADD `notes` varchar(1000);--> statement-breakpoint
ALTER TABLE `users` ADD `full_name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone_number` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `mfa_enabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `role` varchar(50) DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `country_code` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `currency_code` varchar(10) DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `profile_img_url` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` varchar(1000);--> statement-breakpoint
ALTER TABLE `users` ADD `status` varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `users` ADD `total_expense` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password`;