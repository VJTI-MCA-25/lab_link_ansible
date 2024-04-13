### All of these commands are to be run on the local machine

#### SSH Key Generation
>Note: This is already been done on the local machine. Both the private and public SSH keys can be found in `$project_root/.ssh/ directory`

>Follow this command to generate a new SSH key pair

```bash
ssh-keygen -t rsa -b 4096 -C "email"
```

#### Copy the public key to the remote machine
>Note: When adding a new remote machine, the local machine's public key must be copied to the remote machine. Follow this command to copy the public key to the remote machine

>Note: This command will prompt for the remote machine's password

>Note: This command is to be run on the local machine too

>Note: Make sure that the remote machine has an ssh server running
```bash
ssh-copy-id remote_user@remote_ip
```

### All of these commands are to be run on the remote machine
>Note: This command will check if SSH is running on the remote machine

```bash
service ssh status
```

>Note: If the SSH service is not found, follow this command to install it

```bash
sudo apt-get install openssh-server
```

>Note: You will need to run the `ssh-copy-id` command again after installing the SSH server if done before the installation


### These are some packages installed with django

- `django`
- `rest_framework`
- `django-cors-headers`

>TODO: Need to make a virtual environment for the project and make a requirements.txt file