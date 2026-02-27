/**
 * @license MIT
 * Copyright (c) 2025 SGNL.ai, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
"use strict";const e="SGNL-CAEP-Hub/2.0";async function t(t){const r=t.environment||{},n=t.secrets||{};if(n.BEARER_AUTH_TOKEN){const e=n.BEARER_AUTH_TOKEN;return e.startsWith("Bearer ")?e:`Bearer ${e}`}if(n.BASIC_PASSWORD&&n.BASIC_USERNAME){return`Basic ${btoa(`${n.BASIC_USERNAME}:${n.BASIC_PASSWORD}`)}`}if(n.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN){const e=n.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN;return e.startsWith("Bearer ")?e:`Bearer ${e}`}if(n.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET){const t=r.OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL,o=r.OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID,s=n.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET;if(!t||!o)throw new Error("OAuth2 Client Credentials flow requires TOKEN_URL and CLIENT_ID in env");const a=await async function(t){const{tokenUrl:r,clientId:n,clientSecret:o,scope:s,audience:a,authStyle:i}=t;if(!r||!n||!o)throw new Error("OAuth2 Client Credentials flow requires tokenUrl, clientId, and clientSecret");const c=new URLSearchParams;c.append("grant_type","client_credentials"),s&&c.append("scope",s),a&&c.append("audience",a);const E={"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json","User-Agent":e};if("InParams"===i)c.append("client_id",n),c.append("client_secret",o);else{const e=btoa(`${n}:${o}`);E.Authorization=`Basic ${e}`}const l=await fetch(r,{method:"POST",headers:E,body:c.toString()});if(!l.ok){let e;try{const t=await l.json();e=JSON.stringify(t)}catch{e=await l.text()}throw new Error(`OAuth2 token request failed: ${l.status} ${l.statusText} - ${e}`)}const u=await l.json();if(!u.access_token)throw new Error("No access_token in OAuth2 response");return u.access_token}({tokenUrl:t,clientId:o,clientSecret:s,scope:r.OAUTH2_CLIENT_CREDENTIALS_SCOPE,audience:r.OAUTH2_CLIENT_CREDENTIALS_AUDIENCE,authStyle:r.OAUTH2_CLIENT_CREDENTIALS_AUTH_STYLE});return`Bearer ${a}`}return""}var r={invoke:async(r,n)=>{const{userKey:o}=r;if(console.log(`Starting Google session revocation for user ${o}`),!o||"string"!=typeof o)throw new Error("Invalid or missing userKey parameter");let s;try{s=function(e,t){const r=t.environment||{},n=e?.address||r.ADDRESS;if(!n)throw new Error("No URL specified. Provide address parameter or ADDRESS environment variable");return n.endsWith("/")?n.slice(0,-1):n}(r,n)}catch{s="https://admin.googleapis.com"}const a=await async function(r){const n=await t(r),o={Accept:"application/json","Content-Type":"application/json","User-Agent":e};return n&&(o.Authorization=n),o}(n),i=await async function(e,t,r){const n=`${t}/admin/directory/v1/users/${encodeURIComponent(e)}/signOut`;return await fetch(n,{method:"POST",headers:r})}(o,s,a);if(i.ok)return console.log(`Successfully revoked sessions for user ${o}`),{userKey:o,sessionRevoked:!0,revokedAt:(new Date).toISOString()};const c=i.status;let E=`Failed to revoke sessions: HTTP ${c}`;try{const e=await i.json();e.error?.message&&(E=`Failed to revoke sessions: ${e.error.message}`),console.error("Google API error response:",e)}catch{console.error("Failed to parse error response")}const l=new Error(E);throw l.statusCode=c,l},error:async(e,t)=>{const{error:r,userKey:n}=e;throw console.error(`Session revocation failed for user ${n}: ${r.message}`),r},halt:async(e,t)=>{const{reason:r,userKey:n}=e;return console.log(`Session revocation job is being halted (${r}) for user ${n}`),{userKey:n||"unknown",reason:r,haltedAt:(new Date).toISOString(),cleanupCompleted:!0}}};module.exports=r;
