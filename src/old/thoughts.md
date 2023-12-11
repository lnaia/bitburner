example:
first takes 60 seconds
second takes 40 seconds
dispatch first, wait 20seconds + margin (5s), dispatch second;
fuck!

Can't commit resources for that long... and by the time they run, it's out.
need a better resource controller with times..

What if the time controller plans ahead?

Time slots of 30s each

total threads: 1500

slot, time reserved, threads available, requests
1, 30, 1000, { host: 'xpto', script: 'aaa', threads: 1000 }
2, 30, 200
2, 30, 300
3, 30, 10
4, 30, 2000
5, 30
6, 30
7, 30
8, 30
9, 30
