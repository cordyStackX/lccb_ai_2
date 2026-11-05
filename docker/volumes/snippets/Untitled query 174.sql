  update profile_pic
  set profile_pics = replace(profile_pics, 'http://localhost:8000', 'http://localhost:8000')
  where profile_pics like 'http://localhost:8000%';