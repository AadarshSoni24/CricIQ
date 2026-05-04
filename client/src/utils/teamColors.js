/** CricIQ — Team colors and metadata */
export const TEAM_COLORS = {
  'Mumbai Indians': '#004BA0',
  'Chennai Super Kings': '#F9CD05',
  'Royal Challengers Bengaluru': '#EC1C24',
  'Kolkata Knight Riders': '#3A225D',
  'Sunrisers Hyderabad': '#F7A721',
  'Delhi Capitals': '#0078BC',
  'Rajasthan Royals': '#EA1A85',
  'Punjab Kings': '#ED1B24',
  'Gujarat Titans': '#1C1C5E',
  'Lucknow Super Giants': '#A72056',
};

export const TEAM_SHORT = {
  'Mumbai Indians': 'MI',
  'Chennai Super Kings': 'CSK',
  'Royal Challengers Bengaluru': 'RCB',
  'Kolkata Knight Riders': 'KKR',
  'Sunrisers Hyderabad': 'SRH',
  'Delhi Capitals': 'DC',
  'Rajasthan Royals': 'RR',
  'Punjab Kings': 'PBKS',
  'Gujarat Titans': 'GT',
  'Lucknow Super Giants': 'LSG',
};

export const TEAM_GRADIENTS = {
  'Mumbai Indians': 'linear-gradient(135deg, #004BA0, #0066CC)',
  'Chennai Super Kings': 'linear-gradient(135deg, #F9CD05, #E5B800)',
  'Royal Challengers Bengaluru': 'linear-gradient(135deg, #EC1C24, #B30000)',
  'Kolkata Knight Riders': 'linear-gradient(135deg, #3A225D, #5B3A8C)',
  'Sunrisers Hyderabad': 'linear-gradient(135deg, #F7A721, #E08600)',
  'Delhi Capitals': 'linear-gradient(135deg, #0078BC, #005A8C)',
  'Rajasthan Royals': 'linear-gradient(135deg, #EA1A85, #CC1070)',
  'Punjab Kings': 'linear-gradient(135deg, #ED1B24, #CC0000)',
  'Gujarat Titans': 'linear-gradient(135deg, #1C1C5E, #2A2A8A)',
  'Lucknow Super Giants': 'linear-gradient(135deg, #A72056, #8C1A47)',
};

export const ARCHETYPE_COLORS = {
  'Finisher': '#FF6B00',
  'Aggressor': '#EC1C24',
  'Anchor': '#1B4FD8',
  'All-Phase': '#00C851',
  'Accumulator': '#F9CD05',
  'Utility': '#8899BB',
  'Death Specialist': '#EC1C24',
  'Powerplay Specialist': '#FF6B00',
  'Strike Bowler': '#1B4FD8',
  'Defensive': '#00C851',
};

export function getTeamColor(team) {
  return TEAM_COLORS[team] || '#1B4FD8';
}

export function getTeamShort(team) {
  return TEAM_SHORT[team] || team?.substring(0, 3)?.toUpperCase() || '???';
}
