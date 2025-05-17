const { CronJob } = require('cron');
const Note = require('../models/Note');

const archiveOldNotes = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const archived = await Note.updateMany(
    {
      lastUpdated: { $lt: thirtyDaysAgo },
      isArchived: false,
    },
    { $set: { isArchived: true } }
  );

  console.log(`[Cron Job] Archived ${archived.modifiedCount} old notes.`);
};

const startCronJobs = () => {
  const job = new CronJob(
    '0 0 * * *',
    async () => {
      console.log('[Cron Job] Running auto-archive job...');
      await archiveOldNotes();
    },
    null,
    true,
    'UTC'
  );
  job.start();
};

module.exports = startCronJobs;
