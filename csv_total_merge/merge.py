import csv
import pandas as pd

# get this list of file names form somewhere like `glob`
file_names = ['SA2education_v3.csv', 'SA2work_v3.csv']

# def file_to_dict(file_name):
"""Read a two-column csv file into a dict with first column as key
    and an integer value from the second column. 
"""

all_columns = ['collector_key', 'trans_dt', 'store_location_key', 'product_key', 'sales', 'units', 'trans_key', 'trans_id']


df1 = pd.read_csv(file_names[0])
print(df1.head())
df2 = pd.read_csv(file_names[1])
print(df2.head())

df1['At_home'] = df1['At_home'].astype(int)
df2['At_home'] = df2['At_home'].astype(int)

df1['Drive_a_private_car_truck_or_van'] = df1['Drive_a_private_car_truck_or_van'].astype(int)
df2['Drive_a_private_car_truck_or_van'] = df2['Drive_a_private_car_truck_or_van'].astype(int)

df1['Drive_a_company_car_truck_or_van'] = df1['Drive_a_company_car_truck_or_van'].astype(int)
df2['Drive_a_company_car_truck_or_van'] = df2['Drive_a_company_car_truck_or_van'].astype(int)

df1['Passenger_in_a_car_truck_van_or_company_bus'] = df1['Passenger_in_a_car_truck_van_or_company_bus'].astype(int)
df2['Passenger_in_a_car_truck_van_or_company_bus'] = df2['Passenger_in_a_car_truck_van_or_company_bus'].astype(int)

df1['Public_bus'] = df1['Public_bus'].astype(int)
df2['Public_bus'] = df2['Public_bus'].astype(int)

df1['School_bus'] = df1['School_bus'].astype(int)
df2['School_bus'] = df2['School_bus'].astype(int)

df1['Train'] = df1['Train'].astype(int)
df2['Train'] = df2['Train'].astype(int)

df1['Bicycle'] = df1['Bicycle'].astype(int)
df2['Bicycle'] = df2['Bicycle'].astype(int)

df1['Walk_or_jog'] = df1['Walk_or_jog'].astype(int)
df2['Walk_or_jog'] = df2['Walk_or_jog'].astype(int)

df1['Ferry'] = df1['Ferry'].astype(int)
df2['Ferry'] = df2['Ferry'].astype(int)

df1['other'] = df1['other'].astype(int)
df2['other'] = df2['other'].astype(int)

df1['Total'] = df1['Total'].astype(int)
df2['Total'] = df2['Total'].astype(int)

# SA2_code_usual_residence_address,SA2_name_usual_residence_address,SA2_code_other_address,SA2_name_other_address,Study_at_home,Drive_a_car_truck_or_van,Passenger_in_a_car_truck_or_van,Train,Bicycle,Walk_or_jog,School_bus,Public_bus,Ferry,other,Total
# SA2_code_usual_residence_address,SA2_name_usual_residence_address,SA2_code_other_address,SA2_name_other_address,Work_at_home,Drive_a_private_car_truck_or_van,Drive_a_company_car_truck_or_van,Passenger_in_a_car_truck_van_or_company_bus,Public_bus,Train,Bicycle,Walk_or_jog,Ferry,other,Total


# If 'name' is the only identifier in both DFs:
#df3 = df1.merge(df2, on=["SA2_code_usual_residence_address", "SA2_name_usual_residence_address", "SA2_code_other_address", "SA2_name_other_address"])
df3 = pd.concat((df1,df2)).groupby(["SA2_code_usual_residence_address", "SA2_name_usual_residence_address", "SA2_code_other_address", "SA2_name_other_address"],as_index=False).sum()

    # with open(file_name) as fobj:
    #     pairs = (line.split(',') for line in fobj if line.strip())
    #     return {k.strip(): int(v) for k, v in pairs}
    # return csv.DictReader(open(file_name), delimiter=',')
print(df3.head())
    # return data
df3.to_csv('output.csv')

# def merge(data, file_name):
#     """Merge input file with dict `data` adding the numerical values.
#     """
#     inp = file_to_dict(file_name)
#     for i in inp:
#         names = i.keys()

#         line = data.get(line)

#         for name in names:
#             if (name in ('Study_at_home', 'Drive_a_car_truck_or_van', 'Passenger_in_a_car_truck_or_van', 'Train', 'Bicycle', 'Walk_or_jog', 'School_bus', 'Public_bus', 'Ferry', 'other', 'Total')):
#                 line[name] = line.get(name, 0) + int(i.get(name, 0))
#             else:
#                 line[name] = i.get(name)

#     data.update(line)

#     return

# def merge(data, file_name):
#     file_to_dict(file_name)
#     df = pd.DataFrame(data=file_name)


# data = {}
# for file_name in file_names:
#     merge(data, file_name)

# with open('output.csv', 'w') as f:  # Just use 'w' mode in 3.x
#     w = csv.DictWriter(f, i.keys())
#     w.writeheader()
#     w.writerow(my_dict)

# with open('output.csv', 'w') as fobj:
#     for name, val in sorted(data.items()):
#         fobj.write('{},{}\n'.format(name, val))