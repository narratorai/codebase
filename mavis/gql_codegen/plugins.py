from ariadne_codegen.plugins.base import Plugin


class NarratorPlugin(Plugin):
    def generate_enum(self, obj, enum_type):
        """
        This hook modifies the key case of the `company_job_execution_environment_enum` keys.
        The keys are "lambda" and "batch," which can create conflicts in Python due to the reserved keyword "lambda".
        """
        for value in obj.body:
            for target in value.targets:
                if target.id in ("lambda", "batch"):
                    target.id = target.id.upper()

        return obj
