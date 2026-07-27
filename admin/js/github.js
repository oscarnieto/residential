/* ==========================================================================
   Cliente de la API de GitHub
   --------------------------------------------------------------------------
   El panel no tiene servidor: habla directamente con GitHub usando un token
   personal que el editor guarda en su propio navegador. Todos los cambios de
   una publicación viajan en un único commit, de modo que cada publicación
   dispara exactamente un despliegue.
   ========================================================================== */

const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

/* --------------------------------------------------------------------------
   Codificación
   -------------------------------------------------------------------------- */

/** UTF-8 → base64 (btoa sólo acepta latin-1). */
export const encodeBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

/** base64 → UTF-8. */
export const decodeBase64 = (base64) => {
  const binary = atob(String(base64).replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** ArrayBuffer → base64, para subir imágenes sin pasar por texto. */
export const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

/* --------------------------------------------------------------------------
   Cliente
   -------------------------------------------------------------------------- */

export class GitHub {
  constructor({ owner, repo, branch, token }) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.token = token;
  }

  get base() {
    return `${API}/repos/${this.owner}/${this.repo}`;
  }

  async request(path, options = {}) {
    const response = await fetch(path.startsWith('http') ? path : `${this.base}${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });

    if (response.status === 204) return null;

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = payload?.message ?? response.statusText;
      throw new GitHubError(detail, response.status);
    }

    return payload;
  }

  /** Comprueba que el token es válido y tiene permiso de escritura. */
  async verify() {
    const repo = await this.request('');
    if (!repo.permissions?.push) {
      throw new GitHubError(
        'El token no tiene permiso de escritura sobre el repositorio. Revisa que le hayas dado acceso «Contents: Read and write».',
        403
      );
    }
    return repo;
  }

  /** Lee un archivo de texto y devuelve su contenido junto con el sha. */
  async readFile(path) {
    const data = await this.request(
      `/contents/${encodeURI(path)}?ref=${encodeURIComponent(this.branch)}`,
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    return { text: decodeBase64(data.content), sha: data.sha };
  }

  /** Lista los archivos de un directorio. */
  async listDirectory(path) {
    const data = await this.request(`/contents/${encodeURI(path)}?ref=${encodeURIComponent(this.branch)}`);
    return Array.isArray(data) ? data : [];
  }

  /** SHA del último commit de la rama. */
  async headSha() {
    const ref = await this.request(`/git/ref/heads/${encodeURIComponent(this.branch)}`);
    return ref.object.sha;
  }

  /**
   * Publica un conjunto de archivos en un único commit.
   * `files` es una lista de { path, content, encoding } donde encoding es
   * 'utf-8' (por defecto) o 'base64' para binarios.
   */
  async commitFiles(files, message) {
    if (!files.length) return null;

    const parentSha = await this.headSha();
    const parentCommit = await this.request(`/git/commits/${parentSha}`);

    const blobs = await Promise.all(
      files.map(async (file) => {
        const blob = await this.request('/git/blobs', {
          method: 'POST',
          body: JSON.stringify({
            content: file.content,
            encoding: file.encoding === 'base64' ? 'base64' : 'utf-8',
          }),
        });
        return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
      })
    );

    const tree = await this.request('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: blobs }),
    });

    const commit = await this.request('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
    });

    await this.request(`/git/refs/heads/${encodeURIComponent(this.branch)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });

    return commit;
  }

  /** Borra un archivo (usado por la biblioteca de medios). */
  async deleteFile(path, sha, message) {
    return this.request(`/contents/${encodeURI(path)}`, {
      method: 'DELETE',
      body: JSON.stringify({ message, sha, branch: this.branch }),
    });
  }

  /** Última ejecución del workflow de despliegue. */
  async latestDeploy() {
    const data = await this.request(
      `/actions/workflows/deploy.yml/runs?per_page=1&branch=${encodeURIComponent(this.branch)}`
    );
    return data.workflow_runs?.[0] ?? null;
  }
}
