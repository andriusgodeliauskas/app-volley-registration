CREATE TABLE IF NOT EXISTS `user_groups` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `group_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_groups` (`user_id`, `group_id`),
    KEY `idx_user_groups_user` (`user_id`),
    KEY `idx_user_groups_group` (`group_id`),
    
    CONSTRAINT `fk_user_groups_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    CONSTRAINT `fk_user_groups_group`
        FOREIGN KEY (`group_id`)
        REFERENCES `groups` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
