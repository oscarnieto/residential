# Instrucciones del proyecto

Este repositorio sigue la **Política de Seguridad de Aplicaciones** de la empresa. Tenlo presente en todo momento al escribir o modificar código.

## Reglas no negociables

- Aplica la skill `seguridad-aplicaciones` (en `.claude/skills/`) siempre que escribas, generes o modifiques código, **aunque no se mencione la seguridad**.
  > **Sigue sin estar en el repositorio.** Comprobado en el commit `58ecfd1`: sólo llegaron `CLAUDE.md`, `README.md` y `security/attestation.md`. El subidor web de GitHub («Add files via upload») **ignora las carpetas que empiezan por punto**, así que `.claude/skills/seguridad-aplicaciones/SKILL.md` hay que subirlo con `git push`. Mientras tanto la referencia es `security/policy.yml`, que la propia plantilla designa como fuente única de verdad.
- La fuente única de verdad de los controles es `security/policy.yml`.
- **Nunca** metas secretos, credenciales o connection strings en el código: usa variables de entorno o un almacén de secretos.
- **Nunca** desactives, relajes o rodees un control de seguridad "para que compile" o "para ir rápido". Si algo no cumple, dilo.

## Al terminar cualquier cambio de código

1. Ejecuta las comprobaciones locales:
   ```
   bash security/checks/run_all.sh
   ```
2. Entrega el **informe de cumplimiento** (estados `Certificado / Activa / No aplica`) listando los controles del ámbito que aplica.
3. Para los controles `runtime` (XSS de extremo a extremo, autorización, sesión, CSRF, SSRF, subida de ficheros), impleméntalos correctamente y anótalos en `security/attestation.md` para su prueba antes de promover.

## Contexto de enforcement

El merge a la rama protegida está bloqueado por el gate de CI si `run_all.sh` falla. El objetivo es escribir el código de forma que pase el gate a la primera. Esta es la capa que ayuda a cumplir; la obligatoriedad la impone CI + la protección de rama.
