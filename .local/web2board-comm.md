# Comunicación con web2board

Hasta ahora se ha programado que bitbloq-offline se conecta a Github a la versión indicada internamente en web2board-download.json, se la descarga a ~/.config/bitbloq-offline y la ejecuta desde ahí. No me termina de gustar este procedimiento.

Prefiero el siguiente:
- Primero se intenta conectar en local, por si web2board ya está arrancado
- Se busca en el directorio /opt del sistema, por si existiera allí una carpeta web2board o similar
- Se busca en el directorio de ejecución, por si hubiese una carpeta web2board
- Se busca en el directorio de ejecución/resources/web2board
- Finalmente, se busca en ~/.config/bitbloq-offline por si hubiese una carpeta web2board

Es decir, no se descarga desde Internet. En la documentación de instalación de bitbloq-offline se indicará que debe descargarse web2board y realizar una de las instalaciones indicadas. Además, se podrá configurar en bitbloq-offline la ruta real donde web2board está instalada. 

Por tanto, eliminamos todo el comportamiento de descarga de web2board. Solamente que, si no lo encuentra en ningún sitio, se indicará al usuario que es necesario y que lo descargue de la ruta configurada en la aplicación (que será modificable).

## Ficheros críticos para el funcionamiento

### app/scripts/WSHubsApi.js

Este es uno

### app/scripts/WSHubsApi.js

Este es otro
