use anchor_lang::prelude::*;

declare_id!("4LCZpohjxXFNfT2KtTdPsqXNVbUxW2RwaW91CMv3geaQ");

#[program]
pub mod blackbox_program {
    use super::*;

    // Register a new agent in the economy
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_id: String,
        agent_type: String,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_account;
        agent.agent_id = agent_id;
        agent.agent_type = agent_type;
        agent.owner = ctx.accounts.signer.key();
        agent.registered_at = Clock::get()?.unix_timestamp;
        agent.total_transactions = 0;
        agent.total_paid_lamports = 0;
        Ok(())
    }

    // Record an intel batch (called by Scraper Agent)
    pub fn record_intel(
        ctx: Context<RecordIntel>,
        batch_id: String,
        data_hash: String,
        item_count: u32,
    ) -> Result<()> {
        let record = &mut ctx.accounts.intel_record;
        record.batch_id = batch_id;
        record.data_hash = data_hash;
        record.item_count = item_count;
        record.agent = ctx.accounts.signer.key();
        record.recorded_at = Clock::get()?.unix_timestamp;

        // Update agent stats
        let agent = &mut ctx.accounts.agent_account;
        agent.total_transactions += 1;

        Ok(())
    }

    // Record an intelligence report (called by Analysis Agent)
    pub fn record_report(
        ctx: Context<RecordReport>,
        report_id: String,
        data_hash: String,
        action: String,
        confidence: u8,
        paid_lamports: u64,
    ) -> Result<()> {
        let record = &mut ctx.accounts.report_record;
        record.report_id = report_id;
        record.data_hash = data_hash;
        record.action = action;
        record.confidence = confidence;
        record.paid_lamports = paid_lamports;
        record.agent = ctx.accounts.signer.key();
        record.recorded_at = Clock::get()?.unix_timestamp;

        // Update agent stats
        let agent = &mut ctx.accounts.agent_account;
        agent.total_transactions += 1;
        agent.total_paid_lamports += paid_lamports;

        Ok(())
    }

    // Record a trade decision (called by Trading Agent)
    pub fn record_trade(
        ctx: Context<RecordTrade>,
        trade_id: String,
        data_hash: String,
        action: String,
        asset: String,
        paid_lamports: u64,
    ) -> Result<()> {
        let record = &mut ctx.accounts.trade_record;
        record.trade_id = trade_id;
        record.data_hash = data_hash;
        record.action = action;
        record.asset = asset;
        record.paid_lamports = paid_lamports;
        record.agent = ctx.accounts.signer.key();
        record.recorded_at = Clock::get()?.unix_timestamp;

        // Update agent stats
        let agent = &mut ctx.accounts.agent_account;
        agent.total_transactions += 1;
        agent.total_paid_lamports += paid_lamports;

        Ok(())
    }
}

// ─── Account structs ─────────────────────────────────────

#[derive(Accounts)]
#[instruction(agent_id: String, agent_type: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 64 + 32 + 32 + 8 + 8 + 8,
        seeds = [b"agent", signer.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(batch_id: String)]
pub struct RecordIntel<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 64 + 64 + 4 + 32 + 8,
        seeds = [b"intel", signer.key().as_ref(), batch_id.as_bytes()],
        bump
    )]
    pub intel_record: Account<'info, IntelRecord>,
    #[account(
        mut,
        seeds = [b"agent", signer.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(report_id: String)]
pub struct RecordReport<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 64 + 64 + 32 + 1 + 8 + 32 + 8,
        seeds = [b"report", signer.key().as_ref(), report_id.as_bytes()],
        bump
    )]
    pub report_record: Account<'info, ReportRecord>,
    #[account(
        mut,
        seeds = [b"agent", signer.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trade_id: String)]
pub struct RecordTrade<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 64 + 64 + 32 + 32 + 8 + 32 + 8,
        seeds = [b"trade", signer.key().as_ref(), trade_id.as_bytes()],
        bump
    )]
    pub trade_record: Account<'info, TradeRecord>,
    #[account(
        mut,
        seeds = [b"agent", signer.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ─── Data structures ─────────────────────────────────────

#[account]
pub struct AgentAccount {
    pub agent_id: String,
    pub agent_type: String,
    pub owner: Pubkey,
    pub registered_at: i64,
    pub total_transactions: u64,
    pub total_paid_lamports: u64,
}

#[account]
pub struct IntelRecord {
    pub batch_id: String,
    pub data_hash: String,
    pub item_count: u32,
    pub agent: Pubkey,
    pub recorded_at: i64,
}

#[account]
pub struct ReportRecord {
    pub report_id: String,
    pub data_hash: String,
    pub action: String,
    pub confidence: u8,
    pub paid_lamports: u64,
    pub agent: Pubkey,
    pub recorded_at: i64,
}

#[account]
pub struct TradeRecord {
    pub trade_id: String,
    pub data_hash: String,
    pub action: String,
    pub asset: String,
    pub paid_lamports: u64,
    pub agent: Pubkey,
    pub recorded_at: i64,
}
