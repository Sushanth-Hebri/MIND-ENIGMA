import requests
from bs4 import BeautifulSoup

def get_content_inside_a_tags(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find the specific h1 element with class 't-elecblock-heading'
        h1_element = soup.find('h1', {'class': 't-elecblock-heading'})

        if h1_element:
            # Find the <a> tag inside the h1 element
            a_tag_in_h1 = h1_element.find('a')

            if a_tag_in_h1:
                # Extract the text content of the <a> tag in h1
                content_inside_a_tag_in_h1 = a_tag_in_h1.text.strip()
            else:
                print("No <a> tag found inside the h1 element.")
                content_inside_a_tag_in_h1 = None
        else:
            print("H1 element with class 't-elecblock-heading' not found.")
            content_inside_a_tag_in_h1 = None

        # Find the specific div element with class 't-elecblock-right'
        div_element = soup.find('div', {'class': 't-elecblock-right'})

        if div_element:
            # Find the <p> tag inside the div element
            p_tag = div_element.find('p')

            if p_tag:
                # Find the <a> tag inside the p tag
                a_tag_in_p = p_tag.find('a')

                if a_tag_in_p:
                    # Extract the text content of the <a> tag in p
                    content_inside_a_tag_in_p = a_tag_in_p.text.strip()
                else:
                    print("No <a> tag found inside the <p> tag.")
                    content_inside_a_tag_in_p = None
            else:
                print("No <p> tag found inside the div element.")
                content_inside_a_tag_in_p = None
        else:
            print("Div element with class 't-elecblock-right' not found.")
            content_inside_a_tag_in_p = None

        return content_inside_a_tag_in_h1, content_inside_a_tag_in_p

    else:
        print(f"Failed to fetch the webpage. Status code: {response.status_code}")
        return None, None

# Example usage
url = 'https://indianexpress.com/'  # Replace this with the actual URL
content_in_h1, content_in_div = get_content_inside_a_tags(url)

if content_in_h1 and content_in_div:
    print(f"Content inside <a> tag in h1: {content_in_h1}")
    print(f"Content inside <a> tag in div: {content_in_div}")
else:
    print("Content not available.")
