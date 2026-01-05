(()=>{var e={};e.id=6553,e.ids=[6553,3205],e.modules={13878:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=13878,e.exports=t},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},14300:e=>{"use strict";e.exports=require("buffer")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},41808:e=>{"use strict";e.exports=require("net")},77282:e=>{"use strict";e.exports=require("process")},12781:e=>{"use strict";e.exports=require("stream")},71576:e=>{"use strict";e.exports=require("string_decoder")},39512:e=>{"use strict";e.exports=require("timers")},24404:e=>{"use strict";e.exports=require("tls")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},49220:(e,t,s)=>{"use strict";s.r(t),s.d(t,{headerHooks:()=>x,originalPathname:()=>_,patchFetch:()=>S,requestAsyncStorage:()=>l,routeModule:()=>p,serverHooks:()=>m,staticGenerationAsyncStorage:()=>E,staticGenerationBailout:()=>O});var r={};s.r(r),s.d(r,{GET:()=>d});var a=s(95419),o=s(69108),i=s(99678),n=s(78070),u=s(47033),c=s(3205);async function d(){try{if(!await (0,c.getSession)())return n.Z.json({error:"Unauthorized"},{status:401});let e=await u.Z.getConnection();try{let[t]=await e.execute(`
                SELECT COALESCE(SUM(amount), 0) as total_revenue 
                FROM orders 
                WHERE status IN ('paid', 'processing', 'delivered')
            `),[s]=await e.execute(`
                SELECT COUNT(*) as total_leads FROM customers
            `),[r]=await e.execute(`
                SELECT COUNT(*) as pending_count 
                FROM orders o
                LEFT JOIN project_submissions ps ON o.id = ps.order_id
                WHERE o.status = 'paid' AND ps.id IS NULL
            `),[a]=await e.execute(`
                SELECT COUNT(*) as issues_count 
                FROM orders 
                WHERE status = 'payment_failed'
            `),[o]=await e.execute(`
                SELECT o.id, o.razorpay_order_id, o.amount, o.status, o.created_at,
                       c.name as customer_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                ORDER BY o.created_at DESC
                LIMIT 10
            `),[i]=await e.execute(`
                SELECT 
                    DATE(created_at) as date,
                    COALESCE(SUM(amount), 0) as revenue,
                    COUNT(*) as orders
                FROM orders
                WHERE status IN ('paid', 'processing', 'delivered')
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `),[u]=await e.execute(`
                SELECT status, COUNT(*) as count
                FROM orders
                GROUP BY status
            `),[c]=await e.execute(`
                SELECT 
                    source, 
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as revenue
                FROM orders
                WHERE status IN ('paid', 'processing', 'delivered')
                GROUP BY source
            `);return n.Z.json({revenue:t[0].total_revenue,totalLeads:s[0].total_leads,pendingOnboarding:r[0].pending_count,issues:a[0].issues_count,activity:o,chartData:i,statusBreakdown:u,sourceBreakdown:c})}finally{e.release()}}catch(e){return console.error("Dashboard Stats Error:",e),n.Z.json({error:"Failed to fetch stats"},{status:500})}}let p=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/admin/stats/route",pathname:"/api/admin/stats",filename:"route",bundlePath:"app/api/admin/stats/route"},resolvedPagePath:"C:\\Users\\MISHTY5626\\Desktop\\Webhost\\newyearlp\\app\\api\\admin\\stats\\route.ts",nextConfigOutput:"standalone",userland:r}),{requestAsyncStorage:l,staticGenerationAsyncStorage:E,serverHooks:m,headerHooks:x,staticGenerationBailout:O}=p,_="/api/admin/stats/route";function S(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:E})}},3205:(e,t,s)=>{"use strict";s.d(t,{ed:()=>n,getSession:()=>u});var r=s(79616),a=s(31865),o=s(7439);let i=new TextEncoder().encode(process.env.JWT_SECRET||"your-secret-key-change-in-production");async function n(e){let t=await new r.N({admin:e}).setProtectedHeader({alg:"HS256"}).setExpirationTime("24h").sign(i);return(0,o.cookies)().set("admin_session",t,{httpOnly:!0,secure:!0,sameSite:"lax",maxAge:86400,path:"/"}),t}async function u(){let e=o.cookies().get("admin_session")?.value;if(!e)return null;try{let{payload:t}=await (0,a._)(e,i);return t.admin}catch(e){return null}}},47033:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});let r=s(63069).createPool({host:process.env.DB_HOST||"127.0.0.1",port:parseInt(process.env.DB_PORT||"3307"),user:process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"admin",database:process.env.DB_NAME||"newyear",waitForConnections:!0,connectionLimit:10,queueLimit:0})}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[1638,6206,3069,1376],()=>s(49220));module.exports=r})();