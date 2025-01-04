from core.decorators import with_mavis
from core.util.llm import ask_gpt
from core.util.tracking import fivetran_track
from core.v4.mavis import Mavis

prompt = """
GOAL: Clean up the users input data to make it more usable.

INPUT: The user is giving us a comma separated line about a singular software they use.
For each line, try to identify the:
- Software Name: This should be the name only and not the version
- Version : This should be the version
- Producer : The name of the company that make the software
- Price : The price of the software based on the put data (put NA if not available)

Once you have this add, use your knowledge of the software to add the following:
- Category: The category of the software
- Description: A short description of the software
- Capabilities: A list of the capabilities of the software
- Use Cases: A list of the use cases of the software
- Number of Users (Integer): The estimated number of users of the software that {company_name} would have using this software.
- Yearly Price (float): The price of the software for a year for {company_name} based on the standard price of the software and number of users above.

if you do not know the Software then don't add anything.

OUTPUT: Return the data in a structured JSON format.

# Examples
INPUT: "1Password (Cloud)";"AgileBits";"ABC00022";"Yes";"Users";"No"
OUTPUT: {{"Software Name": "1Password", "Version": "Cloud", "Producer": "AgileBits", "Price": "NA", "Category": "Password Manager", "Description": "Password manager that keeps you safe online.", "Capabilities": ["Password Management", "Password Sharing"], "Use Cases": ["Password Management", "Password Sharing", "Password Security"], "number_of_users"; 10000, "yearly_price": 40000}}


""".format(company_name="Toyota")

CLEARFIND_WEBHOOK = "https://webhooks.fivetran.com/webhooks/508e8050-22f5-4637-a9e8-678f5d03e724"


@with_mavis
def enrich_input_data(mavis: Mavis, company_slug=None):
    # read the file and for each line add the data to the company
    with open("/Users/ahmedelsamadisi/Downloads/Clearfind export July 12th 2024.csv") as f:
        next(f)  # Skip the first line
        for line in f:
            res = ask_gpt(prompt, line, use_small_model=True)

            res["run_attempt"] = 1
            fivetran_track(mavis.company.current_user, mavis.company, CLEARFIND_WEBHOOK, res)
