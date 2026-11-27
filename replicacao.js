const arenaReplication=(()=>{
 const profiles={
  steady:{name:'Eco duradouro',capacity:1,duration:12},
  chorus:{name:'Coro breve',capacity:2,duration:7}
 };
 const cost=4,studyDuration=14;

 function create(profileId){
  return {profile:profiles[profileId],charge:0,allies:[]};
 }

 function fragment(formation){
  formation.charge++;
 }

 function expire(formation,clock){
  const {allies}=formation;
  for(let i=allies.length-1;i>=0;i--){
   if(allies[i].until<=clock)allies.splice(i,1);
  }
 }

 function summon(formation,player,clock,study=false){
  const {allies,profile}=formation;
  const side=allies[0]?.side===-1?1:-1;
  allies.push({x:player.x,y:player.y,side,study,until:clock+(study?studyDuration:profile.duration)});
 }

 function studyReward(formation,player,clock){
  expire(formation,clock);
  if(formation.allies.length===formation.profile.capacity)formation.allies.shift();
  summon(formation,player,clock,true);
 }

 function update(formation,player,clock,dt,canSummon){
  expire(formation,clock);
  while(canSummon&&formation.charge>=cost&&formation.allies.length<formation.profile.capacity){
   summon(formation,player,clock);
   formation.charge-=cost;
  }
  formation.charge=Math.min(cost,formation.charge);
  const follow=Math.min(1,dt*8);
  for(const ally of formation.allies){
   const dx=player.fy*ally.side*27-player.fx*27;
   const dy=-player.fx*ally.side*27-player.fy*27;
   ally.x+=(player.x+dx-ally.x)*follow;
   ally.y+=(player.y+dy-ally.y)*follow;
  }
 }

 return {profiles,cost,studyDuration,create,fragment,studyReward,update};
})();
