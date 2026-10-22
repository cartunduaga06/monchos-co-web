# Moncho’s Coffie — desarrollo en ai-server

El entorno de desarrollo vive en `ai-server`, en
`/home/carlos/dev/cafe-los-monchos-pages-standalone`.
Sitio estático HTML/CSS/JS. Python 3.14, Node 22 y Make ya están instalados;
no se necesitan paquetes npm, base de datos ni servicios de pago.

## Acceso y vista previa

La vista previa está siempre disponible en la red local:

http://192.168.40.54:18135

El servicio escucha únicamente en la IP LAN del servidor y en 127.0.0.1.
Desde equipos conectados a esa red no hace falta abrir un túnel SSH.
No se configuró publicación de este puerto en Internet.
La dirección LAN está asignada por DHCP: reservar 192.168.40.54 para ai-server
conserva este enlace. Si cambia, actualizar `ops/monchos-preview.service`,
instalar la plantilla en `~/.config/systemd/user/` y reiniciar el servicio.

Como alternativa mediante SSH desde PowerShell:

```powershell
ssh -N -L 18135:127.0.0.1:18135 ai-server-codex
```

Mantén esa terminal abierta y visita http://localhost:18135.
El alias SSH existente usa el puerto 2222.
Para editar, usa VS Code Remote SSH con `ai-server-codex` y abre la carpeta
anterior, o entra con `ssh ai-server-codex`.

## Trabajar y publicar

En la terminal del servidor:

```bash
cd /home/carlos/dev/cafe-los-monchos-pages-standalone
git switch develop
git fetch origin
git merge --ff-only origin/main
# Editar index.html, styles.css, app.js o assets/; recargar la vista previa.
make check
# Revisar visualmente en escritorio y móvil.
git add index.html styles.css app.js assets/
git commit -m "Describe el cambio"
make publish
```

`make publish` requiere un árbol limpio, valida los recursos, arma `dist/`,
respalda la rama en GitHub y avanza `main` únicamente mediante fast-forward.
Si `main` cambió, se detiene para que integres esos cambios.
La publicación es explícita: guardar archivos o hacer commit no publica.
También se pueden usar ramas `feature/...` y pull requests hacia `main`.

GitHub Actions valida cada push y pull request hacia main; publica únicamente
los pushes a main que pasan la validación. El artefacto contiene solo
`index.html`, `styles.css`, `app.js`, `.nojekyll`, `CNAME` y los medios admitidos de
`assets/`; no incluye scripts, documentación ni metadatos del repositorio.
El repositorio es público: no guardar secretos en ningún archivo versionado.

Sitio público: https://monchos.co/
Despliegues: https://github.com/cartunduaga06/monchos-co-web/actions/workflows/pages.yml

## Comandos y servicio

- `make check`: sintaxis JS, archivos, referencias y anclas HTML.
- `make build`: valida y genera dist/.
- `make dev`: vista previa manual si el servicio está detenido.
- `make status`: estado Git.
- `systemctl --user status monchos-preview`: estado del servicio persistente.
- `systemctl --user restart monchos-preview`: reinicio.
- `journalctl --user -u monchos-preview -n 40`: registros.

El servicio arranca con el gestor de usuario; linger está habilitado para
mantenerlo activo después de cerrar SSH y tras reiniciar el servidor.
Su plantilla versionada está en `ops/monchos-preview.service`.

## Recuperación

Para deshacer una publicación, crear una rama desde origin/main, ejecutar
`git revert <commit>` y publicar con `make publish`. Así se conserva el historial.
El respaldo inicial del repositorio y la configuración anterior de Pages están
fuera del repositorio, en `~/.local/state/monchos-development/`.

GitHub Pages se configura con `build_type: workflow` para que la validación
controle la publicación. Referencia:
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Repositorio y dominio canónicos

El repositorio de publicación es `cartunduaga06/monchos-co-web` (`origin`).
`main` publica https://monchos.co/; `develop` es la rama de trabajo.
La configuración conserva el dominio personalizado y su historial anterior.
El remoto `demo` conserva el repositorio de la demo como referencia histórica;
`make publish` trabaja exclusivamente con `origin`.
La carpeta del servidor y la vista previa LAN permanecen en las ubicaciones anteriores.
