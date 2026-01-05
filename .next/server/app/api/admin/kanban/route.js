(()=>{var e={};e.id=8892,e.ids=[8892],e.modules={13878:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=13878,e.exports=t},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},14300:e=>{"use strict";e.exports=require("buffer")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},41808:e=>{"use strict";e.exports=require("net")},77282:e=>{"use strict";e.exports=require("process")},12781:e=>{"use strict";e.exports=require("stream")},71576:e=>{"use strict";e.exports=require("string_decoder")},39512:e=>{"use strict";e.exports=require("timers")},24404:e=>{"use strict";e.exports=require("tls")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},19133:(e,t,r)=>{"use strict";r.r(t),r.d(t,{headerHooks:()=>x,originalPathname:()=>L,patchFetch:()=>O,requestAsyncStorage:()=>m,routeModule:()=>l,serverHooks:()=>E,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>y});var s={};r.r(s),r.d(s,{GET:()=>d,PUT:()=>p});var a=r(95419),o=r(69108),i=r(99678),n=r(78070),u=r(47033),c=r(76997);async function d(){try{let e=await u.Z.getConnection();try{let[t]=await e.execute(`
                SELECT 
                    o.id, o.razorpay_order_id, o.amount, o.status, o.created_at,
                    c.name as customer_name, c.email as customer_email, c.id as customer_id,
                    ps.brand_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN project_submissions ps ON o.id = ps.order_id
                ORDER BY o.created_at DESC
            `),[r]=await e.execute(`
                SELECT 
                    c.id as customer_id,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.created_at,
                    'new_lead' as status,
                    NULL as id,
                    NULL as razorpay_order_id,
                    NULL as amount,
                    NULL as brand_name
                FROM customers c
                LEFT JOIN orders o ON c.id = o.customer_id
                WHERE o.id IS NULL
                ORDER BY c.created_at DESC
            `),s=[...t,...r];return n.Z.json(s)}finally{e.release()}}catch(e){return n.Z.json({error:"Failed to fetch kanban data"},{status:500})}}async function p(e){try{let{orderId:t,newStatus:r}=await e.json(),s=await u.Z.getConnection();try{await s.execute("UPDATE orders SET status = ? WHERE id = ?",[r,t]);let[e]=await s.execute("SELECT customer_id FROM orders WHERE id = ?",[t]),a=e[0]?.customer_id||null;return await (0,c._)(a,t,"system_event",`Order status updated to ${r} `),n.Z.json({success:!0})}finally{s.release()}}catch(e){return n.Z.json({error:"Failed to update status"},{status:500})}}let l=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/admin/kanban/route",pathname:"/api/admin/kanban",filename:"route",bundlePath:"app/api/admin/kanban/route"},resolvedPagePath:"C:\\Users\\MISHTY5626\\Desktop\\Webhost\\newyearlp\\app\\api\\admin\\kanban\\route.ts",nextConfigOutput:"standalone",userland:s}),{requestAsyncStorage:m,staticGenerationAsyncStorage:_,serverHooks:E,headerHooks:x,staticGenerationBailout:y}=l,L="/api/admin/kanban/route";function O(){return(0,i.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:_})}},76997:(e,t,r)=>{"use strict";r.d(t,{_:()=>a});var s=r(47033);async function a(e,t,r,a,o="neutral",i=null){try{let n=await s.Z.getConnection();try{await n.execute("INSERT INTO interactions (customer_id, order_id, type, content, sentiment, created_by) VALUES (?, ?, ?, ?, ?, ?)",[e,t,r,a,o,i])}finally{n.release()}}catch(e){console.error("CRM Log Error:",e)}}},47033:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});let s=r(63069).createPool({host:process.env.DB_HOST||"127.0.0.1",port:parseInt(process.env.DB_PORT||"3307"),user:process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"admin",database:process.env.DB_NAME||"newyear",waitForConnections:!0,connectionLimit:10,queueLimit:0})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[1638,6206,3069],()=>r(19133));module.exports=s})();