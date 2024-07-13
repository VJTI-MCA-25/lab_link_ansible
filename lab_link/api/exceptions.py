class HostUnreachable(Exception):
    def __init__(self, message="The Host was unreachable"):
        self.message = message

        super().__init__(self.message)


class HostNotFound(Exception):
    def __init__(self, message="The Host was not found"):
        self.message = message

        super().__init__(self.message)
