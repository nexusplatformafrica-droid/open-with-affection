<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Sitemaps and robots.txt are server routes that build URLs from the request host (src/lib/seo-sitemap.ts); why: no hardcoded domain, works on any published/custom domain.
- Whop deposits: checkout created server-side (src/lib/whop.functions.ts, key in WHOP_API_KEY secret); PaymentPoller confirms via Whop payments API by plan id; why: never trust the browser for crediting.
