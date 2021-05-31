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

        selectServer(serverParam);

        var puuidGlobal;

        async function getSummoner(server,name) {
            if (name) {
                const response = await fetch(url+summoner+server+"/"+name);
                const summonerEntry = await response.json();
                if (summonerEntry.puuid) {
                    document.getElementById("summoner_name").textContent=summonerEntry.name;
                    document.getElementById("summoner_level").textContent=summonerEntry.summonerLevel;
                    getSummonerIcon(summonerEntry.profileIconId);
                    getRank(server,summonerEntry.id);
                    puuidGlobal = summonerEntry.puuid;
                    createMatchHistory(server,puuidGlobal);
                } else {
                    document.getElementById("summoner_name").textContent="No Summoner Found";
                }
            }
        }

        async function getSummonerIcon(iconId) {
            const response = await fetch(url+img+"icon/summoner/"+iconId);
            const iconBlob = await response.blob();
            document.getElementById("summoner_icon").src = URL.createObjectURL(iconBlob);
        }

        async function getRank(server,id) {
            const response = await fetch(url+summoner+server+"/"+id+"/rank");
            const rankEntry = await response.json();
            for (var i = 0; i < rankEntry.length; ++i) {
                if (rankEntry[i].queueType == "RANKED_SOLO_5x5") {
                    const wins = rankEntry[i].wins;
                    const losses = rankEntry[i].losses;
                    document.getElementById("rank_name").textContent=rankEntry[i].tier+" "+rankEntry[i].rank;
                    document.getElementById("wins").textContent=wins;
                    document.getElementById("seperator").textContent="/";
                    document.getElementById("losses").textContent=losses;
                    document.getElementById("win_percentage").textContent=Math.round((wins/(wins+losses))*1000)/10 + "% ("+(wins+losses)+")";
                    if (!rankEntry[i].miniSeries) {
                        document.getElementById("lp").textContent=rankEntry[i].leaguePoints+" LP";
                    }
                    getSoloqRankImage(rankEntry[i].tier);
                } else if (rankEntry[i].queueType == "RANKED_FLEX_SR") {
                    const wins = rankEntry[i].wins;
                    const losses = rankEntry[i].losses;
                    document.getElementById("flex_rank_name").textContent=rankEntry[i].tier+" "+rankEntry[i].rank;
                    document.getElementById("flex_wins").textContent=wins;
                    document.getElementById("flex_seperator").textContent="/";
                    document.getElementById("flex_losses").textContent=losses;
                    document.getElementById("flex_win_percentage").textContent=Math.round((wins/(wins+losses))*1000)/10 + "% ("+(wins+losses)+")";
                    if (!rankEntry[i].miniSeries) {
                        document.getElementById("flex_lp").textContent=rankEntry[i].leaguePoints+" LP";
                    }
                    getFlexqRankImage(rankEntry[i].tier);
                }
            }
        }

        async function getSoloqRankImage(rank) {
            const response = await fetch(url+img+"rank/"+rank);
            const imgEntry = await response.blob();
            const imgEl = document.getElementById("rank_img");
            imgEl.src = URL.createObjectURL(imgEntry);
        }

        async function getFlexqRankImage(rank) {
            const response = await fetch(url+img+"rank/"+rank);
            const imgEntry = await response.blob();
            const imgEl = document.getElementById("flex_rank_img");
            imgEl.src = URL.createObjectURL(imgEntry);
        }

        var beginIndex=0;
        var endIndex=5;

        async function createMatchHistory(server,puuid) {
            const response = await fetch(url+match+server+"/"+puuid+"/ids?beginIndex="+beginIndex+"&endIndex="+endIndex)
            const matchIds = await response.json();
            if (await matchIds) {
                moveIndexes();
            }
            for (var i=0; i<matchIds.length; i++) {
                const detailsResponse = await fetch(url+match+server+"/"+matchIds[i]+"/details")
                const details = await detailsResponse.json();
                createMatchDiv(details,puuid);
            }
        }

        function moveIndexes() {
            beginIndex+=5;
            endIndex+=5;
            console.log(beginIndex+","+endIndex);
        }

        async function createMatchDiv(matchDetails,puuid) {
            if (matchDetails.info && puuid) {
                const matchDiv = document.createElement('div');
                matchDiv.className = "match";
                await createMatchData(matchDetails,matchDiv,puuid);
                document.getElementById('match_history').appendChild(matchDiv);
            }
        }

        var bg = false;

        async function createMatchData(matchDetails,matchWrapper,puuid) {
            const participants = matchDetails.info.participants;
            var winningTeamId = 0;
            var teamId = participants[0].teamId;
            if(participants[0].win==true) {
                winningTeamId=teamId;
            } else {
                winningTeamId=(300-teamId);
            }
            for (var i=0; i<participants.length; i++) {
                if (participants[i].puuid==puuid) {
                    const matchDetailsWrapper = document.createElement('div');
                    matchWrapper.appendChild(matchDetailsWrapper);
                    matchDetailsWrapper.id = "match_data";
                    createMatchDetailsForSummoner(matchDetails,participants[i],matchDetailsWrapper);
                    setAttributesToMatchDiv(matchWrapper,winningTeamId,participants[i].teamId);
                    createItemContainerDiv(matchWrapper,participants[i]);
                    if (bg==false) {
                        bg = true;
                        setBg(participants[i].championName);
                    }
                    break;
                }
            }
            createTeams(participants,puuid,matchWrapper);
        }

        async function createMatchDetailsForSummoner(matchDetails,participant,matchDetailsWrapper) {

            //First Section
            const firstSectionWrapper = document.createElement('div');
            matchDetailsWrapper.appendChild(firstSectionWrapper);
            firstSectionWrapper.id = "first";

            const gameType = document.createElement('p');
            firstSectionWrapper.appendChild(gameType);
            gameType.textContent="Game"; //TODO
            gameType.id = "queue";

            const gameTimeP = document.createElement('p');
            firstSectionWrapper.appendChild(gameTimeP);
            const timeEpoch = matchDetails.info.gameDuration;
            const time = new Date(timeEpoch);
            var minutes = time.getMinutes();
            var seconds = time.getSeconds();
            if (minutes<10) {
                minutes = "0"+minutes;
            }
            if (seconds<10) {
                seconds = "0"+seconds;
            }
            gameTimeP.textContent=minutes+":"+seconds;
            gameTimeP.id = "game_time";

            const dateP = document.createElement('p');
            firstSectionWrapper.appendChild(dateP);
            const dateEpoch = matchDetails.info.gameCreation;
            const date = new Date(dateEpoch);
            dateP.textContent=date.toUTCString();
            dateP.id = "date";

            //Second section
            const secondSectionWrapper = document.createElement('div');
            matchDetailsWrapper.appendChild(secondSectionWrapper);
            secondSectionWrapper.id = "second";

            const championIcon = document.createElement('img');
            secondSectionWrapper.appendChild(championIcon);
            const responseMain = await fetch(url+img+"icon/champion/"+participant.championName);
            const imgEntry = await responseMain.blob();
            championIcon.src=URL.createObjectURL(imgEntry);
            championIcon.id = "match_champion_icon";

            const summonerSpellWrapper = document.createElement('div');
            secondSectionWrapper.appendChild(summonerSpellWrapper);
            summonerSpellWrapper.id = "ss_wraper";

            const summonerSpell1 = document.createElement('img');
            summonerSpellWrapper.appendChild(summonerSpell1);
            const summonerSpell2 = document.createElement('img');
            summonerSpellWrapper.appendChild(summonerSpell2);

            //TODO summonery

            //Third section
            const thirdSectionWrapper = document.createElement('div');
            matchDetailsWrapper.appendChild(thirdSectionWrapper);
            thirdSectionWrapper.id = "third";

            const kda = document.createElement('p');
            thirdSectionWrapper.appendChild(kda);
            const kills = document.createElement('span')
            const seperator1 = document.createElement('span')
            const deaths = document.createElement('span');
            const seperator2 = document.createElement('span');
            const assists = document.createElement('span');
            kda.appendChild(kills);
            kda.appendChild(seperator1);
            kda.appendChild(deaths);
            kda.appendChild(seperator2);
            kda.appendChild(assists);
            seperator1.innerText=" / "
            seperator2.innerText=" / "
            kills.innerText=participant.kills;
            deaths.innerText=participant.deaths;
            assists.innerText=participant.assists;

            deaths.id = "deaths_stat";

            const farm = document.createElement('p');
            thirdSectionWrapper.appendChild(farm);
            const cs = participant.totalMinionsKilled+participant.neutralMinionsKilled;
            farm.innerText=(cs)+" cs"; //TODO cs per min
            farm.id = "farm_stat";
        }

        async function setAttributesToMatchDiv(match, winningTeamId, participantTeamId) {
            if (participantTeamId==winningTeamId) {
                match.id="match_won";
            } else {
                match.id="match_lost";
            }
        }

        async function createItemContainerDiv(match, participant) {
            const itemWrapper = document.createElement('div');
            match.appendChild(itemWrapper);
            itemWrapper.id = "item_data";
            const itemIds = [participant.item0,participant.item1,participant.item2,participant.item3,participant.item4,participant.item5,participant.item6];
            for (var i=0; i<itemIds.length; i++) {
                if (itemIds[i]==0) {
                    var itemPlaceHolder = document.createElement('div');
                    itemWrapper.appendChild(itemPlaceHolder);
                    itemPlaceHolder.id = "item";
                } else {
                    var itemIcon = document.createElement('img');
                    itemWrapper.appendChild(itemIcon);
                    var itemResponse = await fetch(url+img+"icon/item/"+itemIds[i]);
                    var itemImgEntry = await itemResponse.blob();
                    itemIcon.id = "item";
                    itemIcon.src = URL.createObjectURL(itemImgEntry);
                }
            } 
        }

        async function createTeams(participants,puuid,matchWrapper) {
            const participantsWrapper = document.createElement('div');
            matchWrapper.appendChild(participantsWrapper);
            participantsWrapper.id = "participants_data";

            const team1 = document.createElement('div');
            participantsWrapper.appendChild(team1);
            team1.id = "team";
            const team2 = document.createElement('div');
            participantsWrapper.appendChild(team2);
            team2.id = "team";
            for (var i=0; i<participants.length; i++) {
                var participantDiv = document.createElement('div');
                if (participants[i].teamId==100) {
                    team1.appendChild(participantDiv);
                } else {
                    team2.appendChild(participantDiv);
                }
                participantDiv.id = "participant";
                //Champion icon
                var champIcon = document.createElement('img');
                participantDiv.appendChild(champIcon);
                champIcon.id = "participant_champion_icon";
                var champResponse = await fetch(url+img+"icon/champion/"+participants[i].championName);
                var imgEntry = await champResponse.blob();
                champIcon.src = URL.createObjectURL(imgEntry);

                //Summoner name
                var participantA = document.createElement('a');
                participantDiv.appendChild(participantA);
                participantA.id = "participant_name"
                participantA.href = "./profile.html?server="+serverParam+"&name="+participants[i].summonerName;
                var participantName = document.createElement('p');
                participantA.appendChild(participantName);
                participantName.innerText = participants[i].summonerName;

                // Highlight summoner name
                if (participants[i].puuid==puuid) {
                    participantDiv.id = "summoner";
                }
            }
        }

        async function setBg(champion) {
            const bg = document.getElementsByClassName("header_profile");
            bg[0].style.backgroundImage = ("url('"+url+img+"splash/"+champion+"')");
        }

        getSummoner(serverParam,summonerNameParam); 

        const moreBtn = document.getElementById("load_more_btn");
        moreBtn.onclick = function() {
            createMatchHistory(serverParam,puuidGlobal);
        }
