
        const btn = document.getElementById("search_button");
        const field = document.getElementById("search_field");
        const server_select = document.getElementById("server_select");

        function selectServer(server) {
            server_select.value=server;
        }

        function redirect(server,summonerName) {
            location.href= "./profile.html?server="+server+"&name="+summonerName;
        }

        btn.addEventListener("click", async e => {
            if (field.value) {
                redirect(document.getElementById("server_select").value,field.value);
            }
        });
