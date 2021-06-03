
        const btn = document.getElementById("search-button");
        const field = document.getElementById("search-field");
        const serverSelect = document.getElementById("server-select");

        function selectServer(server) {
            if (server) {
                serverSelect.value=server;
            }
        }

        function redirect(server,summonerName) {
            location.href= "./profile.html?server="+server+"&name="+summonerName;
        }

        btn.addEventListener("click", async e => {
            if (field.value) {
                redirect(document.getElementById("server-select").value,field.value);
            }
        });

        field.addEventListener("keydown", function(event) {
            if (event.code=="Enter") {
                event.preventDefault();
                btn.click();
            }
        });
