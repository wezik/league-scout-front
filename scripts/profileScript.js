        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const serverParam = urlParams.get('server')
        const summonerNameParam = urlParams.get('name')

        const url = "http://localhost:8080/v1/";
        const data = "data/";
        const summoner = "summoner/";
        const champion = "champion";
        const match = "match/";
        const img = "img/";
        const api = "api/";

        selectServer(serverParam);

        var serverVar = serverParam;
        var puuidVar;
        var startIndex=0;
        var endIndex=10;
        var bgChampion;

        function endLoading() {
            document.getElementById('loader').style.display='none';
        }

        async function getSummoner(server,name) {
            if(server && name) {
                const summonerResponse = await fetch(url+summoner+server+'/'+name);
                const summonerEntry = await summonerResponse.json();
                if (summonerEntry.puuid) {
                    loadSummonerData(summonerEntry);
                    puuidVar=summonerEntry.puuid;
                    createMatchHistory(summonerEntry.puuid);
                    setButtons(summonerEntry);
                } else {
                }
            }
        }

        function setButtons(summonerEntry) {
            console.log('przyps');
            const liveButton = document.getElementById('live-button');
            if (summonerEntry.name) {
                liveButton.href="live.html?server="+serverVar+"&name="+summonerEntry.name;
                liveButton.style.display="flex";
                
            }
        }

        async function loadSummonerData(summonerEntry) {
            document.getElementById('summoner-name').innerText=summonerEntry.name;
            document.getElementById('summoner-level').innerText=summonerEntry.summonerLevel;
            const iconResponse = await fetch(url+img+'icon/summoner/'+summonerEntry.profileIconId);
            const iconBlob = await iconResponse.blob();
            document.getElementById('summoner-icon').src= URL.createObjectURL(iconBlob);
            const rankResponse = await fetch(url+summoner+serverVar+'/'+summonerEntry.id+'/rank');
            const rankJson = await rankResponse.json();
            for (var i=0; i<rankJson.length; i++) {
                if (rankJson[i].queueType=="RANKED_SOLO_5x5") {
                    if (rankJson[i].tier=="MASTER" || rankJson[i].tier=="GRANDMASTER" || rankJson[i].tier=="CHALLENGER") {
                        document.getElementById('soloq-rank-name').innerText=rankJson[i].tier;
                    } else {
                        document.getElementById('soloq-rank-name').innerText=rankJson[i].tier+' '+rankJson[i].rank;
                    }
                    if (!rankJson[i].miniSeries) {
                        document.getElementById('soloq-lp').innerText=rankJson[i].leaguePoints+' LP';
                    }
                    const rankResponse = await fetch(url+img+'rank/'+rankJson[i].tier);
                    const rankBlob = await rankResponse.blob();
                    document.getElementById('soloq-rank-img').src=URL.createObjectURL(rankBlob);
                    var wins = rankJson[i].wins;
                    var losses = rankJson[i].losses;
                    var total = wins+losses;
                    document.getElementById('soloq-win-percent').innerText=Math.round((wins/total)*1000)/10+'% ('+total+')';
                    document.getElementById('soloq-wins').innerText=wins;
                    document.getElementById('soloq-seperator').innerText='/';
                    document.getElementById('soloq-losses').innerText=losses;
                } else if (rankJson[i].queueType=="RANKED_FLEX_SR") {
                    if (rankJson[i].tier=="MASTER" || rankJson[i].tier=="GRANDMASTER" || rankJson[i].tier=="CHALLENGER") {
                        document.getElementById('flexq-rank-name').innerText=rankJson[i].tier;
                    } else {
                        document.getElementById('flexq-rank-name').innerText=rankJson[i].tier+' '+rankJson[i].rank;
                    }
                    if (!rankJson[i].miniSeries) {
                        document.getElementById('flexq-lp').innerText=rankJson[i].leaguePoints+' LP';
                    }
                    const rankResponse = await fetch(url+img+'rank/'+rankJson[i].tier);
                    const rankBlob = await rankResponse.blob();
                    document.getElementById('flexq-rank-img').src=URL.createObjectURL(rankBlob);
                    var wins = rankJson[i].wins;
                    var losses = rankJson[i].losses;
                    var total = wins+losses;
                    document.getElementById('flexq-win-percent').innerText=Math.round((wins/total)*1000)/10+'% ('+total+')';
                    document.getElementById('flexq-wins').innerText=wins;
                    document.getElementById('flexq-seperator').innerText='/';
                    document.getElementById('flexq-losses').innerText=losses;
                }
            }
        }

        var saved = false;
        function loadRecentGamesData(wins) {
            if(!saved) {
                saved=true;
                document.getElementById('recent-wins').innerText=wins;
                document.getElementById('recent-losses').innerText=(10-wins);
                document.getElementById('recent-win-percent').innerText=(wins/10)*100+'%';
            }
        }

        async function createMatchHistory(puuid) {
            const matchesResponse = await fetch(url+api+'history/'+serverVar+'/'+puuid+'/'+startIndex+'/'+endIndex);
            const matches = await matchesResponse.json();
            var recentWins = 0;
            for (var i=0; i<matches.length; i++) {
                if(!bgChampion) {
                    bgChampion = matches[i].summoner.championName;
                    setBgImage(bgChampion);
                }
                if(matches[i].summoner.win==true) {
                    recentWins++;
                }
                createMatch(matches[i]);
            }
            loadRecentGamesData(recentWins);
            startIndex+=5;
            endIndex+=5;
        }

        function createMatch(match) {
            const matchDiv = document.createElement('div');
            matchDiv.className = "match";
            if (match.summoner.win==true) {
                matchDiv.className = matchDiv.className+" won-game";
            } else if (match.summoner.win==false) {
                matchDiv.className = matchDiv.className+" lost-game"
            }
            createGameDetails(match,matchDiv);
            document.getElementById('match-history').appendChild(matchDiv);
        }

        function createGameDetails(match, mainDiv) {
            createMatchInfo(match, mainDiv);
            createMatchChampion(match,mainDiv);
            createMatchDetails(match,mainDiv);
            createMatchMetrics(match,mainDiv);
            createMatchItems(match,mainDiv);
            createMatchPlayers(match,mainDiv);
            endLoading();
            document.getElementById('load-more-btn').style.display="block";
        }

        function createMatchInfo(match, mainDiv) {
            const matchInfoDiv = document.createElement('div');
            matchInfoDiv.className="match-info";
            mainDiv.appendChild(matchInfoDiv);

            const gameType = document.createElement('p');
            gameType.id="game-type";
            gameType.innerText=match.gameMode;
            const gameDuration = document.createElement('p');
            gameDuration.id="game-duration";
            const time = new Date(match.gameDuration);
            var minutes = time.getMinutes();
            var seconds = time.getSeconds();
            if (minutes<10) {
                minutes = "0"+minutes;
            }
            if (seconds<10) {
                seconds = "0"+seconds;
            }
            gameDuration.innerText=minutes+':'+seconds;
            const gameResult = document.createElement('p');
            gameResult.id="game-result";
            if (match.summoner.win==false) {
                gameResult.innerText="Defeat"
            } else {
                gameResult.innerText="Victory"
            }
            const gameTime = document.createElement('p');
            gameTime.id="game-time";
            const fullTime = new Date(match.gameEnd);
            var year = fullTime.getUTCFullYear();
            var month = fullTime.getUTCMonth()+1;
            var day = fullTime.getUTCDate();
            var hours = fullTime.getUTCHours();
            var minutes = fullTime.getUTCMinutes();
            array = [day,hours,minutes];
            for (var i=0; i<array.length; i++) {
                if (array[i]<10) {
                    array[i]='0'+array[i];
                }
            }
            gameTime.innerText=array[0]+'/'+month+'/'+year+' '+array[1]+':'+array[2]+' UTC';

            matchInfoDiv.appendChild(gameType);
            matchInfoDiv.appendChild(gameDuration);
            matchInfoDiv.appendChild(gameResult);
            matchInfoDiv.appendChild(gameTime);
        }

        async function createMatchChampion(match, mainDiv) {
            const matchChampionDiv = document.createElement('div');
            matchChampionDiv.className="match-champion";
            mainDiv.appendChild(matchChampionDiv);

            const championIconImg = document.createElement('img');
            championIconImg.src=url+img+'icon/champion/'+match.summoner.championName;
            championIconImg.alt=match.summoner.championName;
            matchChampionDiv.appendChild(championIconImg);

            const matchSummonersDiv = document.createElement('div');
            matchSummonersDiv.className="match-summoners"
            const summoner1Img = document.createElement('img');
            summoner1Img.src=url+img+'icon/summonerspell/'+match.summoner.summoner1Id;

            const summoner2Img = document.createElement('img');
            summoner2Img.src=url+img+'icon/summonerspell/'+match.summoner.summoner2Id;

            matchChampionDiv.appendChild(matchSummonersDiv);
            matchSummonersDiv.appendChild(summoner1Img);
            matchSummonersDiv.appendChild(summoner2Img);
        }

        function createMatchDetails(match, mainDiv) {
            const matchDetailsDiv = document.createElement('div');
            mainDiv.appendChild(matchDetailsDiv);
            matchDetailsDiv.className="match-details"
            const matchStatsDiv = document.createElement('div');
            matchDetailsDiv.appendChild(matchStatsDiv);
            matchStatsDiv.className="match-stats"

            var kills=match.summoner.kills;
            var deaths=match.summoner.deaths;
            var assists=match.summoner.assists;
            var kda=0;
            if (deaths>0) {
                var kda = Math.round(((kills+assists)/deaths)*100)/100;
            }
            const kdaRatioP = document.createElement('p');
            matchStatsDiv.appendChild(kdaRatioP);
            kdaRatioP.id="kda-ratio";
            if (kda>0) {
                if (kda>3) {
                    kdaRatioP.className="kda-over-3";
                }
                kdaRatioP.innerText=kda+' KDA';
            } else if (deaths==0) {
                kdaRatioP.innerText="No deaths!"
                kdaRatioP.className="kda-over-3";
            } else {
                kdaRatioP.innerText="0 KDA"
            }

            const kdaDiv = document.createElement('div');
            kdaDiv.className = 'kda';
            matchStatsDiv.appendChild(kdaDiv);

            const killsSpan = document.createElement('span');
            const seperator1 = document.createElement('span');
            const deathsSpan = document.createElement('span');
            const seperator2 = document.createElement('span');
            const assistsSpan = document.createElement('span');
            killsSpan.id="kills";
            deathsSpan.id="deaths";
            assistsSpan.id="assists";
            killsSpan.innerText=kills;
            seperator1.innerText=' / ';
            deathsSpan.innerText=deaths;
            seperator2.innerText=' / ';
            assistsSpan.innerText=assists;

            kdaDiv.appendChild(killsSpan);
            kdaDiv.appendChild(seperator1);
            kdaDiv.appendChild(deathsSpan);
            kdaDiv.appendChild(seperator2);
            kdaDiv.appendChild(assistsSpan);

            const farmDiv = document.createElement('div');
            matchStatsDiv.appendChild(farmDiv);
            farmDiv.className = "farm";

            const farmSpan = document.createElement('span');
            farmSpan.id = "farm"
            const time = new Date(match.gameDuration);
            var minutes = time.getMinutes();
            var cs = match.summoner.neutralMinionsKilled+match.summoner.totalMinionsKilled;
            var csPerMin = Math.round((cs/minutes)*10)/10;
            if (csPerMin>=8) {
                farmSpan.className = "farm-over-8";
            }
            farmSpan.innerText=cs+' ('+csPerMin+') CS';
            farmDiv.appendChild(farmSpan);
        }

        function createMatchMetrics(match, mainDiv) {
            const matchMetricsDiv = document.createElement('div');
            mainDiv.appendChild(matchMetricsDiv);
            matchMetricsDiv.className="match-metrics";

            const totalDamageP = document.createElement('p');
            totalDamageP.id="total-damage";
            totalDamageP.innerHTML="<i class=\"fas fa-tint\"></i>"+match.summoner.totalDamageDealtToChampions;
            var highestDamage = 0;
            for (var i=0; i<match.team1.length; i++) {
                if (match.team1[i].totalDamageDealtToChampions>highestDamage) {
                    highestDamage=match.team1[i].totalDamageDealtToChampions;
                }
            }
            for (var i=0; i<match.team2.length; i++) {
                if (match.team2[i].totalDamageDealtToChampions>highestDamage) {
                    highestDamage=match.team2[i].totalDamageDealtToChampions;
                }
            }

            const damagePercent = Math.round((match.summoner.totalDamageDealtToChampions/highestDamage)*100);

            if (damagePercent>=80) {
                totalDamageP.className="damage-over-80";
            }
            matchMetricsDiv.appendChild(totalDamageP);

            const emptyBar = document.createElement('div');
            emptyBar.className="bar-empty";
            matchMetricsDiv.appendChild(emptyBar);

            const fillBar = document.createElement('div');
            fillBar.className="bar-fill";
            fillBar.style.width=damagePercent+"%";
            fillBar.alt=damagePercent+"% compared to highest damage";

            emptyBar.appendChild(fillBar);

            const totalGoldP = document.createElement('p');
            totalGoldP.innerHTML="<i class=\"fas fa-coins\"></i>"+match.summoner.goldEarned;
            totalGoldP.id="total-gold";
            matchMetricsDiv.appendChild(totalGoldP);
        }

        async function createMatchItems(match, mainDiv) {
            const matchItemsDiv = document.createElement('div');
            mainDiv.appendChild(matchItemsDiv);
            matchItemsDiv.className="match-items";
            var item0 = match.summoner.item0;
            var item1 = match.summoner.item1;
            var item2 = match.summoner.item2;
            var item3 = match.summoner.item3;
            var item4 = match.summoner.item4;
            var item5 = match.summoner.item5;
            var item6 = match.summoner.item6;
            array = [item0,item1,item2,item3,item4,item5,item6];
            for (var i=0; i<array.length; i++) {
                var item;
                if (array[i]>0) {
                    item = document.createElement('img');
                    item.src = url+img+'icon/item/'+array[i];
                } else {
                    item = document.createElement('div');
                    item.className="empty-item";
                }
                matchItemsDiv.appendChild(item);
            }
        }

        function createMatchPlayers(match, mainDiv) {

            const matchPlayers = document.createElement('div');
            mainDiv.appendChild(matchPlayers);
            matchPlayers.className="match-players";

            const team1Div = document.createElement('div');
            const team2Div = document.createElement('div');
            team1Div.className="team1"
            team2Div.className="team2"
            
            matchPlayers.appendChild(team1Div);
            matchPlayers.appendChild(team2Div);

            var team1 = match.team1;
            var team2 = match.team2;

            for(var i=0; i<team1.length; i++) {
                var p = document.createElement('p');
                p.innerHTML="<img src=\""+url+img+"icon/champion/"+team1[i].championName+"\" alt=\""+team1[i].championName+"\"><a href=\"profile.html?server="+serverVar+"&name="+team1[i].summonerName+"\">"+team1[i].summonerName+"</a>";
                if (team1[i].puuid==match.summoner.puuid) {
                    p.className="summoner";
                }
                team1Div.appendChild(p);
            }
            for(var i=0; i<team2.length; i++) {
                var p = document.createElement('p');
                p.innerHTML="<img src=\""+url+img+"icon/champion/"+team2[i].championName+"\" alt=\""+team2[i].championName+"\"><a href=\"profile.html?server="+serverVar+"&name="+team2[i].summonerName+"\">"+team2[i].summonerName+"</a>";
                if (team2[i].puuid==match.summoner.puuid) {
                    p.className="summoner";
                }
                team2Div.appendChild(p);
            }
        }

        function setBgImage(championName) {
            const header = document.getElementById('header');
            header.style.backgroundImage= "url(\""+url+img+"splash/"+championName+"\")";
        }

        document.getElementById('load-more-btn').addEventListener('click', (e) => {
            if(puuidVar) {
                document.getElementById('load-more-btn').style.display="none";
                createMatchHistory(puuidVar);
            }
        });

        document.getElementById('load-more-btn').style.display="none";
        getSummoner(serverParam,summonerNameParam);
