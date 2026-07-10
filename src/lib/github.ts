import { Octokit } from "octokit";

function client() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured on the server.");
  return new Octokit({ auth: token });
}

function repoInfo() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!owner || !repo) {
    throw new Error("GITHUB_OWNER / GITHUB_REPO are not configured on the server.");
  }
  return { owner, repo, branch };
}

export async function readJsonFile<T>(path: string): Promise<{ data: T; sha: string }> {
  const octokit = client();
  const { owner, repo, branch } = repoInfo();
  const res = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  if (Array.isArray(res.data) || res.data.type !== "file" || !res.data.content) {
    throw new Error(`${path} is not a file in ${owner}/${repo}`);
  }

  const content = Buffer.from(res.data.content, "base64").toString("utf-8");
  return { data: JSON.parse(content) as T, sha: res.data.sha };
}

export async function writeJsonFile(
  path: string,
  data: unknown,
  sha: string,
  message: string
) {
  const octokit = client();
  const { owner, repo, branch } = repoInfo();
  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf-8").toString(
    "base64"
  );

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    message,
    content,
    sha,
  });
}
