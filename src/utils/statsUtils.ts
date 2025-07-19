
export const getKDRatio = (stats: any) => {
  if (!stats) {
    console.log('❌ No stats provided to getKDRatio');
    return '0.00';
  }
  
  console.log('🎯 Extracting K/D from stats:', stats);
  console.log('🎯 Available stat keys:', Object.keys(stats));
  
  // Try direct K/D ratio first
  if (stats['K/D Ratio']) {
    const ratio = parseFloat(stats['K/D Ratio']).toFixed(2);
    console.log('✅ Found K/D Ratio directly:', ratio);
    return ratio;
  }
  
  // Try calculated from kills/deaths
  if (stats.Kills && stats.Deaths) {
    const kills = parseInt(stats.Kills);
    const deaths = parseInt(stats.Deaths);
    const ratio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    console.log('✅ Calculated K/D from Kills/Deaths:', ratio);
    return ratio;
  }
  
  // Try lowercase variants
  if (stats.kills && stats.deaths) {
    const kills = parseInt(stats.kills);
    const deaths = parseInt(stats.deaths);
    const ratio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    console.log('✅ Calculated K/D from kills/deaths (lowercase):', ratio);
    return ratio;
  }
  
  // Try single letter variants
  if (stats.K && stats.D) {
    const kills = parseInt(stats.K);
    const deaths = parseInt(stats.D);
    const ratio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    console.log('✅ Calculated K/D from K/D (single letter):', ratio);
    return ratio;
  }
  
  console.log('❌ Could not extract K/D ratio');
  return '0.00';
};

export const getHeadshotPercentage = (stats: any) => {
  if (!stats) {
    console.log('❌ No stats provided to getHeadshotPercentage');
    return '0';
  }
  
  console.log('🎯 Extracting HS% from stats:', stats);
  console.log('🎯 Available stat keys:', Object.keys(stats));
  
  // Try direct percentage fields
  if (stats['Headshots %']) {
    const percentage = Math.round(parseFloat(stats['Headshots %']));
    console.log('✅ Found Headshots % directly:', percentage);
    return percentage.toString();
  }
  
  if (stats['Headshot %']) {
    const percentage = Math.round(parseFloat(stats['Headshot %']));
    console.log('✅ Found Headshot % directly:', percentage);
    return percentage.toString();
  }
  
  if (stats.headshots_percentage) {
    const percentage = Math.round(parseFloat(stats.headshots_percentage));
    console.log('✅ Found headshots_percentage directly:', percentage);
    return percentage.toString();
  }
  
  // Try calculated from headshots/kills
  if (stats.Headshots && stats.Kills) {
    const headshots = parseInt(stats.Headshots);
    const kills = parseInt(stats.Kills);
    const percentage = kills > 0 ? Math.round((headshots / kills) * 100) : 0;
    console.log('✅ Calculated HS% from Headshots/Kills:', percentage);
    return percentage.toString();
  }
  
  // Try lowercase variants
  if (stats.headshots && stats.kills) {
    const headshots = parseInt(stats.headshots);
    const kills = parseInt(stats.kills);
    const percentage = kills > 0 ? Math.round((headshots / kills) * 100) : 0;
    console.log('✅ Calculated HS% from headshots/kills (lowercase):', percentage);
    return percentage.toString();
  }
  
  console.log('❌ Could not extract headshot percentage');
  return '0';
};

export const getADR = (stats: any) => {
  if (!stats) {
    console.log('❌ No stats provided to getADR');
    return '0';
  }
  
  console.log('🎯 Extracting ADR from stats:', stats);
  console.log('🎯 Available stat keys:', Object.keys(stats));
  
  // Try different ADR field variants
  if (stats.ADR) {
    const adr = Math.round(parseFloat(stats.ADR));
    console.log('✅ Found ADR directly:', adr);
    return adr.toString();
  }
  
  if (stats['Average Damage per Round']) {
    const adr = Math.round(parseFloat(stats['Average Damage per Round']));
    console.log('✅ Found Average Damage per Round:', adr);
    return adr.toString();
  }
  
  if (stats.average_damage) {
    const adr = Math.round(parseFloat(stats.average_damage));
    console.log('✅ Found average_damage:', adr);
    return adr.toString();
  }
  
  if (stats['Damage/Round']) {
    const adr = Math.round(parseFloat(stats['Damage/Round']));
    console.log('✅ Found Damage/Round:', adr);
    return adr.toString();
  }
  
  console.log('❌ Could not extract ADR');
  return '0';
};
