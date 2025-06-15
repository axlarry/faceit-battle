
export const getKDRatio = (stats: any) => {
  if (!stats) return '0.00';
  
  if (stats['K/D Ratio']) {
    return parseFloat(stats['K/D Ratio']).toFixed(2);
  }
  
  if (stats.Kills && stats.Deaths) {
    const kills = parseInt(stats.Kills);
    const deaths = parseInt(stats.Deaths);
    return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  }
  
  if (stats.kills && stats.deaths) {
    const kills = parseInt(stats.kills);
    const deaths = parseInt(stats.deaths);
    return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  }
  
  return '0.00';
};

export const getHeadshotPercentage = (stats: any) => {
  if (!stats) return '0';
  
  if (stats['Headshots %']) {
    return Math.round(parseFloat(stats['Headshots %']));
  }
  
  if (stats['Headshot %']) {
    return Math.round(parseFloat(stats['Headshot %']));
  }
  
  if (stats.headshots_percentage) {
    return Math.round(parseFloat(stats.headshots_percentage));
  }
  
  if (stats.Headshots && stats.Kills) {
    const headshots = parseInt(stats.Headshots);
    const kills = parseInt(stats.Kills);
    return kills > 0 ? Math.round((headshots / kills) * 100) : 0;
  }
  
  if (stats.headshots && stats.kills) {
    const headshots = parseInt(stats.headshots);
    const kills = parseInt(stats.kills);
    return kills > 0 ? Math.round((headshots / kills) * 100) : 0;
  }
  
  return '0';
};

export const getADR = (stats: any) => {
  if (!stats) return '0';
  
  if (stats.ADR) {
    return Math.round(parseFloat(stats.ADR));
  }
  
  if (stats['Average Damage per Round']) {
    return Math.round(parseFloat(stats['Average Damage per Round']));
  }
  
  if (stats.average_damage) {
    return Math.round(parseFloat(stats.average_damage));
  }
  
  if (stats['Damage/Round']) {
    return Math.round(parseFloat(stats['Damage/Round']));
  }
  
  return '0';
};
