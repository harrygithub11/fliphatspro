ALTER TABLE customers 
MODIFY COLUMN stage ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'follow_up_required', 'follow_up_done') DEFAULT 'new';
