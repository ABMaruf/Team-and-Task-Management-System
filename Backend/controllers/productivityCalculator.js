// Calculate productivity score for a completed task
export const calculateTaskProductivityScore = (task) => {
  const priorityPoints = {
    'low': 10,
    'medium': 20,
    'high': 30,
    'urgent': 50
  };

  let score = priorityPoints[task.priority?.toLowerCase()] || 10;

  // Bonus for completing before deadline
  if (task.deadline && task.completed_at) {
    const deadline = new Date(task.deadline);
    const completedAt = new Date(task.completed_at);
    
    if (completedAt < deadline) {
      const daysEarly = Math.floor((deadline - completedAt) / (1000 * 60 * 60 * 24));
      score += daysEarly * 5;
    } else if (completedAt > deadline) {
      // Penalty for late completion
      const daysLate = Math.floor((completedAt - deadline) / (1000 * 60 * 60 * 24));
      score -= daysLate * 3;
    }
  }

  // Bonus for completing under estimated time
  if (task.estimated_hours && task.actual_hours) {
    if (task.actual_hours < task.estimated_hours) {
      const efficiency = (task.estimated_hours - task.actual_hours) / task.estimated_hours;
      score += Math.floor(efficiency * 20);
    }
  }

  return Math.max(score, 0); // No negative scores
};