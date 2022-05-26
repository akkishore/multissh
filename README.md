# Multissh

Connect to multiple hosts over SSH and interact with them in parallel. 

## Usage

Two ways to run it:    

**1. With .multissh.conf config file:** 
  
Enter your host groups into .multissh.conf file in your HOME dir and launch 'multissh'. Sample config file:  

    [{
      "group": "Host group 1",
      "hosts": [
        "user@domain1.of.host.com",
        "user@domain2.of.host.com"
      ]
    }, {
      "group": "Host group 2",
      "hosts": [
        "user@another1.domain.of.host.com",
        "user@another2.domain.of.host.com"
      ]
    }]

**2. From command line:**  

    ./multissh <user@domain.of.host1> <user@domain.of.host2> <user@domain.of.host3> <user@domain.of.host4>

## Download

Look at GitHub releases.

## Contribute

Feel free to submit pull requests.
