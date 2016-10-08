La Ruche qui dit oui - Plugin Discourse
=======================================

## Local development using vagrant

```
vagrant up
vagrant ssh
cd /vagrant
bundle exec rails s -b 0.0.0.0
```

## Installation using docker

```
cd /var/discourse
vi container/app.yml
```

Add the following to your app.yml in the plugins section:

```
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - mkdir -p plugins
          - git clone https://github.com/ekkans/lrqdo-plugin-discourse.git
```

and rebuild docker via

```
cd /var/discourse
./launcher rebuild app
```
