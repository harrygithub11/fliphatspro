-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 24, 2026 at 06:33 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbfliphats`
--

-- --------------------------------------------------------

--
-- Table structure for table `smtp_accounts`
--

CREATE TABLE `smtp_accounts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `host` varchar(255) NOT NULL,
  `imap_host` varchar(255) DEFAULT NULL,
  `port` int(11) NOT NULL,
  `imap_port` int(11) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `imap_user` varchar(255) DEFAULT NULL,
  `encrypted_password` text NOT NULL,
  `imap_encrypted_password` text DEFAULT NULL,
  `oauth_refresh_token` text DEFAULT NULL,
  `oauth_access_token` text DEFAULT NULL,
  `oauth_expires_at` datetime DEFAULT NULL,
  `from_email` varchar(255) NOT NULL,
  `from_name` varchar(255) NOT NULL,
  `dkim_selector` varchar(255) DEFAULT NULL,
  `dkim_private_key` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `region` varchar(50) DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `tenant_id` varchar(191) DEFAULT NULL,
  `imap_secure` tinyint(1) DEFAULT 1,
  `last_sync` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `smtp_accounts`
--

INSERT INTO `smtp_accounts` (`id`, `name`, `provider`, `host`, `imap_host`, `port`, `imap_port`, `username`, `imap_user`, `encrypted_password`, `imap_encrypted_password`, `oauth_refresh_token`, `oauth_access_token`, `oauth_expires_at`, `from_email`, `from_name`, `dkim_selector`, `dkim_private_key`, `created_by`, `created_at`, `updated_at`, `is_active`, `region`, `last_synced_at`, `tenant_id`, `imap_secure`, `last_sync`) VALUES
(4, 'test', 'custom', 'smtp.hostinger.com', 'imap.hostinger.com', 465, 993, 'test@fliphatmedia.com', NULL, '6758ec8862122a070788542f83626e22:ff670a29bd37a0fa0c640d772087bf5c', NULL, NULL, NULL, NULL, 'test@fliphatmedia.com', 'test', NULL, NULL, 1, '2026-01-21 21:38:53', '2026-01-21 21:38:53', 1, NULL, NULL, 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7', 1, '2026-01-24 16:18:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `smtp_accounts`
--
ALTER TABLE `smtp_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `smtp_accounts_tenant_id_idx` (`tenant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `smtp_accounts`
--
ALTER TABLE `smtp_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `smtp_accounts`
--
ALTER TABLE `smtp_accounts`
  ADD CONSTRAINT `smtp_accounts_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
