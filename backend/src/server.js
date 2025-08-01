const app = require('./app');
const config = require('./config/config');
const db = require('./config/database');

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

const server = app.listen(config.port, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
});

// --- Background task: mark expired bookings as completed every 5 minutes ---
const COMPLETE_JOB_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function runBookingCompletionJob() {
  const sql = `UPDATE bookings
               SET status = 'completed'
               WHERE status = 'confirmed'
                 AND datetime(created_at, printf('+%d hours', hours)) <= CURRENT_TIMESTAMP`;
  db.run(sql, function (err) {
    if (err) {
      console.error('Booking completion job error:', err);
    } else if (this.changes) {
      console.log(`[Booking Job] Marked ${this.changes} bookings as completed`);
    }
  });
}

// kick off interval
setInterval(runBookingCompletionJob, COMPLETE_JOB_INTERVAL_MS);
// also run once at startup
runBookingCompletionJob();

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
}); 